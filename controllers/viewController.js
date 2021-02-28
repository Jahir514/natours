const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res) => {
   
    const tours = await Tour.find();

    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        select: 'review user rating'
        
    });

    if (!tour) {
        return next(new AppError('There is no such tour with this name', 404));
    }
    
    //console.log(tour.reviews[0]);
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    });
});

exports.getSignUp = (req, res) => {
   
    res.status(200).render('signUp', {
        title: 'SignUp Page'
    });
};

exports.getLogin = (req, res) => {
   
    res.status(200).render('login', {
        title: 'Login Page'
    });
};

exports.getAccount = (req, res, next) => {
    
    res.status(200).render('account', {
        title: 'My account'
    });
};
