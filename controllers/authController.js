const crypto = require('crypto');
const util = require('util'); // to acess methods like promisify to handle promise
const jwt = require('jsonwebtoken');
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require('./../utils/appError');
const Email = require('./../utils/mail');

// create token

const signToken = id => {
    return jwt.sign({ id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
    
}

// send token

const sendToken = (user, res) => {
    const token = signToken(user._id);

    const cookieOption = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), // day to milisecond
        httpOnly: true // can only store and send not modify cookie
    };

    if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

    res.cookie('jwt', token, cookieOption);
    user.password = undefined;

    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    }); 
}


// for signup a user

exports.signUp = catchAsync (async (req, res, next) => {
    
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        changedPasswordAt: req.body.changedPasswordAt
    });

    url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
    sendToken(newUser, res);
});


// for logging an user

exports.login = catchAsync(async (req, res, next) => {

    
    // catch email and password
    const { email, password } = req.body;  // short of  email = req.body.email and password = req.body.password

    //1) check if email and password exist
    if (!email || !password) {
        
        return next(new AppError('Please provide email and password', 400));
    }

    //2) check user exist and password is correct
    const user = await User.findOne({ email: email }).select('+password');

    const correct = await user.correctPassword(password, user.password);

    if (!user || !correct){
        return next(new AppError('Incorrect email or password', 401));
    }

    //3) if everything ok send token

    sendToken(user, res);

});


// For protecting route from unauthorized access

exports.protect = catchAsync(async (req, res, next) => {
    
    let token;
    const authorization = req.headers.authorization;

    // 1) getting the token and check if its there
    if (authorization && authorization.startsWith('Bearer')) {
        token = authorization.split(' ')[1];
    } else if (req.cookies.jwt) { // checking if the token is in cookies
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You are not logged in !! Please log in to get access', 401));
    }

    // 2) verification of the token
    const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) check if the user is still exists

    const currentUser = await User.findById(decoded.id);

    // checking if the user is deleted but its token remain
    if (!currentUser) {
        return next(new AppError('The user belongs to this token no longer exists', 401));
    }

    // 4) if user change its password after token issued

    if (currentUser.changedPassword(decoded.iat)) {
        return next(new AppError('User has recently changed password!! Please log in again', 401));
    }

    // get access the protected route
    req.user = currentUser; // we can send data from  one middleware to another by req object
    res.locals.user = currentUser;
    next();

});



// Only for rendering

exports.isLoggedIn = async (req, res, next) => {
     
    if (req.cookies.jwt) {
        try {
            // 1) verify cookie token
            const decoded = await util.promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2) check if the user is still exists
            const currentUser = await User.findById(decoded.id);

            // checking if the user is deleted but its token remain
            if (!currentUser) {
                return next();
            }
            // 3) if user change its password after token issued

            if (currentUser.changedPassword(decoded.iat)) {
                return next();
            }
            // get access the protected route
            res.locals.user = currentUser;// sending user data to pug
            return next();
        } catch (err) {
            return next();
        }

    }
    next();
};




// Restrict User

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) { // this req.user.role comes from previous middleware
            return next(new AppError('You have no permission to perform this action', 403));
        }

        next();
    };
};


// Password forget method

exports.forgotPassword = catchAsync(async (req, res, next) => {
     // 1) get the user using his given email
    const email = req.body.email;
    const user = await User.findOne({ email: email });
    
    if (!user) {
        return next(new AppError('NO user found with this email!! Please provide a valid email', 404));
    }
    
    // 2) generate a simple token
    const resetToken = user.createResetPasswordToken();
    await user.save({validateBeforeSave: false}); // remove all the validator before saving document

    // 3) send it to user via email
   


    try {
        // await sendEmail({
        //     email: user.email,
        //     subject: 'your password reset token (valid for 10 min)',
        //     message
        // });
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        await new Email(user, resetURL).sendPasswordReset();
    
        res.status(200).json({
            status: 'success',
            message: 'Token sent to mail Successfully'
        });
    } catch (err) {
        console.error(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('Something got Error sending Mail! Please try again later', 500));
            
    }

});




// Password reset method


exports.resetPassword = catchAsync(async (req, res, next) => {
     
    // 1) find the user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now()} });

    // 2) if token is not expired and there is user, set the new password

    if (!user) {
        return next(new AppError('token is invalid or expired! please provide a valid token', 400));
    }
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // 3) update changePasswordAt property for the user
        // Done in user model
    
    // 4) Log the user in and send JWT token
    sendToken(user, res);
    
});


// Logged In User Update password


exports.updatePassword = catchAsync(async (req, res, next) => {
    
    // 1) get the user
    const id = req.user.id; // this user id comes from protect route
    const user = await User.findById(id).select('+password');
    // 2) check if the given password is correct
    //const password = await user.select('+password');
    const {currentPassword, password, confirmPassword} = req.body;
    
    const correct = await user.correctPassword(currentPassword, user.password);

    if (!user || !correct){
        return next(new AppError('Incorrect password!! Please provide valid current password', 401));
    }

    // 3) update the password
    user.password = password;
    user.confirmPassword = confirmPassword;
    await user.save();
    // 4) log in the user

    sendToken(user, res);
})


// logout
exports.logout = (req, res) => {
    // sending cookie with same name but different token and expire time is 10s
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() +  10 * 1000), // second to milisecond
        httpOnly: true
    });

    res.status(200).json({
        status: 'success'
    }); 
}