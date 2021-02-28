const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User must have a name'],
        trim : true
    },
    email: {
        type: String,
        required: [true, 'User must have an email'],
        unique: true,
        validate: [validator.isEmail, 'Please provide a valid Email']
    },
    password: {
        type: String,
        required: [true, 'User must have an password'],
        minlength: [7, 'Password length must be 7 '],
        select: false // when we use select query password dont show
    },
    confirmPassword: {
        type: String,
        required: [true, 'User have to confirm the password'],
        minlength: [7, 'Confirm password length must be 7 '],
        validate: {
            validator: function (el) {
                // validator only works on creat and save method
                return el === this.password;
            },
            message: 'Password and Comfirm password are not same'
        }
        
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    changedPasswordAt: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});





//hashing password before storing in database
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12); //bcrypt returns a promise

    this.confirmPassword = undefined;
    next();
});



// update changePasswordAt field after reset the password

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.changedPasswordAt = Date.now() - 30000; // Assigning JWT token is faster than saving changepasswordAt field; thats why (-3000)

    next();
});

// query middleware to check if any user is active or not before finding it
userSchema.pre(/^find/, function (next) {
    this.find({active: {$ne: false}})
    next();
});

// create instance method that is availale to all the instances of the document
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};


// create instance method to check if the user change his password after getting a JWT Token
userSchema.methods.changedPassword = function (jwtTimeStamp) {
    if (this.changedPasswordAt) {
        const changedTimeStamp = parseInt(this.changedPasswordAt.getTime()/1000, 10);
        return jwtTimeStamp < changedTimeStamp;
    }
    
    // false means no change of password
    return false;
}


// create instance method to create a Normal Token for password Reset

userSchema.methods.createResetPasswordToken = function () {
    // 1) generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // 2) hash token
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // we just modify this field, we have to save it
    this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 min to reset password. convert 10 min to milisecond

    //console.log(resetToken, this.resetPasswordToken);
    return resetToken;
}


const User = mongoose.model('User', userSchema);

module.exports = User;

