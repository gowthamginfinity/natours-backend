const express = require('express');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/userController');
const {
  signUp,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
  logout,
} = require('../controllers/authController');
const userRouter = express.Router();

// userRouter.route('/signup').post(signup);
userRouter.post('/signup', signUp);
userRouter.post('/login', login);
userRouter.get('/logout', logout);
userRouter.post('/forgotPassword', forgotPassword);
userRouter.patch('/resetPassword/:token', resetPassword);

// protect all routes after this middle ware
userRouter.use(protect);

userRouter.patch('/updateMyPassword', updatePassword);
userRouter.get('/me', getMe, getUser);
userRouter.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
userRouter.delete('/deleteMe', deleteMe);

userRouter.use(restrictTo('admin'));

userRouter.route('/').get(getAllUsers).post(createUser);
userRouter.route('/:id').patch(updateUser).get(getUser).delete(deleteUser);

module.exports = userRouter;
