const multer = require('multer');
const sharp = require('sharp');
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require('./../utils/appError');


const factory = require('./handleFactory');

//multer storage on disk not memory
// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req,file, cb) => {
//         // getting extension from file mimetype
//         const ext = file.mimetype.split('/')[1];
//         // creating filename
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });


// multer storage in memory
const multerStorage = multer.memoryStorage();

// multer filter to check it is an image
const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null, true);
    } else{
        cb(new AppError('Its not an image! Please upload only image', 400), false);
    }
};



//multer config
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

//multer middleware
exports.uploadUserPhoto = upload.single('photo');

// resize user photo
exports.resizeUserPhoto = (req, res, next) => {
    if(!req.file){
        return next();
    }

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    sharp(req.file.buffer) // to access the file from memory
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/users/${req.file.filename}`);
    
    next();
};

// filter fields from request body
const filterObjet = (obj, ...fields) => {
    let filterObjet = {};
    Object.keys(obj).forEach(el => {
        if (fields.includes(el)) {
            filterObjet[el] = obj[el];
        }
    })
    return filterObjet;
};


// get personal data of current user

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}


// user data update without password
exports.updateMe = catchAsync(async (req, res, next) => {

    //console.log(req.file);
    //console.log(req.body);

    // 1) check if there is any password or confirm password field
    if (req.body.password || req.body.confirmPassword) {
        return next(new AppError('You cant update password in this route', 400));
    }
    //2) filter the request body

    const filteredbody = filterObjet(req.body, 'name', 'email');
    if(req.file) filteredbody.photo = req.file.filename;
    
    // 3) update user data

    const updateUser = await User.findByIdAndUpdate(req.user.id, filteredbody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        message: 'Successfully update user',
        data: {
            updateUser
        }
    });
    
});


// Delete User
exports.deleteMe = catchAsync(async (req, res, next) => {

     await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        message: 'Successfully delete user',
        data: null
    });
});


exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.updateUsers = factory.updateOne(User);

// permanently delete user by admin
exports.deleteUsers = factory.deleteOne(User);