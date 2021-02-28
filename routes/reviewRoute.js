const express = require('express'); 

// importing tourControllers Modules
const reviewController = require('./../controllers/reviewController');

// importing authController Modules
const authController = require('./../controllers/authController');

const router = express.Router({mergeParams: true}); // to get access the tourId



router.use(authController.protect);

router.route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewController.setTourUserId,
        reviewController.createReviews
    );

router.route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReviews)
    .delete(authController.restrictTo('admin', 'user'), reviewController.deleteReviews);


module.exports = router;