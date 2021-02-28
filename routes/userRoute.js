const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');




const router = express.Router();



//for Authentication and out of protect middleware

router.post('/signUp', authController.signUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);


// all the router(router is basically is middleware and its run one after another) after this router will be under protect middleware
router.use(authController.protect);

// user operation route by user
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updatePassword', authController.updatePassword);
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);


// only admin can access these routes
router.use(authController.restrictTo('admin'))

router.route('/')
.get(userController.getAllUsers)

router.route('/:id')
.get(userController.getUser)
.patch(userController.updateUsers)
.delete(userController.deleteUsers);

module.exports = router;