const express = require('express'); 

// importing tourControllers Modules
const tourController = require('./../controllers/tourController');

// importing authController Modules
const authController = require('./../controllers/authController');

//import reviews routes
const reviewRouter = require('./../routes/reviewRoute');

const router = express.Router();


router.use('/:tourId/reviews', reviewRouter); // route to get the reviews from a specific tour


router.route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTours
    );

router.route('/tour-stat').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
);
// all the tour within a radius from a certain point
router.route('/tours-within/:distance/center/:latlan/unit/:unit').get(tourController.getToursWithin);
// closetest tour from a certain point
router.route('/distance/:latlan/unit/:unit').get(tourController.getDistance);

router.route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourPhoto,
        tourController.resizeTourPhoto,
        tourController.updateTours
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTours
    );

module.exports = router;