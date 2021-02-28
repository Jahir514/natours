const Review = require('./../models/reviewModel');
// const catchAsync = require('./../utils/catchAsync');

const factory = require('./handleFactory');


exports.setTourUserId = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;

    next();
}

// create Review 
exports.createReviews = factory.createOne(Review);




// get all the reviews
exports.getAllReviews = factory.getAll(Review);

//get single review
exports.getReview = factory.getOne(Review);

// Update Reviews
exports.updateReviews = factory.updateOne(Review);

// Delete Reviews
exports.deleteReviews = factory.deleteOne(Review);





