const express = require('express');
const viewController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');
const router = express.Router();



//for Authentication and out of protect middleware

router.get('/',authController.isLoggedIn, viewController.getOverview);

router.get('/tour/:slug',authController.isLoggedIn, viewController.getTour);
router.get('/signUp',authController.isLoggedIn, viewController.getSignUp);
router.get('/login',authController.isLoggedIn, viewController.getLogin);
router.get('/me',authController.protect, viewController.getAccount);




module.exports = router;

