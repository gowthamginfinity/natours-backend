const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/apiError');
const { promisify } = require('util');
const validator = require('validator');
const Email = require('../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true, // Cookie can not be accessed or modified by the browser
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  // Cookie will only be sent on an encrypted connection (HTTPS)
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; // Password ni response lo include cheyakunda chesstunnam

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const signUp = async (req, res) => {
  const newUser = await User.create(req.body);
  // const newUser = await User.create({
  //   name: req.body.name,
  //   email: req.body.email,
  //   password: req.body.password,
  //   confirmPassword: req.body.confirmPassword,
  // });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
};

const login = async (req, res) => {
  // 'next' parameter theesesam (Express 5)
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    throw new AppError('Please provide email and password!', 400);
  }

  // 2) Check if user exists && get their password
  // Schema lo select: false undi kabatti, explicit ga +password tho thesthunnam
  const user = await User.findOne({ email }).select('+password');

  // 3) Check if password is correct (Using the Instance Method from Model)
  // user object lekapothe (null ayithe) correctPassword function pani cheyadu, anduke Optional Chaining (?) leda kinda logic vadali.
  const isCorrect = user
    ? await user.correctPassword(password, user.password)
    : false;

  // 4) Anti-Hacking generic error
  if (!user || !isCorrect) {
    throw new AppError('Incorrect email or password', 401); // 401 Unauthorized
  }

  // 5) If everything ok, send token to client
  createSendToken(user, 200, res);
};

const isLoggedIn = async (req, res, next) => {
  // 1) Check if the cookie exists
  if (!req.cookies || !req.cookies.jwt) {
    return next();
  }

  try {
    // 2) Verify token natively using standard Promise wrapper
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(req.cookies.jwt, process.env.JWT_SECRET, (err, payload) => {
        if (err) reject(err);
        resolve(payload);
      });
    });

    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      return next();
    }

    // 4) Check if password was changed after token issuance
    if (freshUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    // 5) THERE IS A LOGGED IN USER! Inject into locals for Pug views
    res.locals.user = freshUser;
    return next();
  } catch (err) {
    // Okavela token corrupted ayina, silent ga next layout ki vellipovali (No Error Page Screen)
    return next();
  }
};

const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

const protect = async (req, res, next) => {
  // Middleware kabatti 'next' kachitanga undali
  // 1) Get token and check if it's there
  let token;

  // Headers lo authorization unda, inka adi 'Bearer' tho start avtunda ani check chestunnam
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // "Bearer eyJhbG..." ni space tho split chesi 2nd part (index 1) theeskuntunnam
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // Token lekapothe gate daggare aapesi error throw chestham (Express 5 approach)
  if (!token) {
    throw new AppError(
      'You are not logged in! Please log in to get access.',
      401,
    );
  }

  // 2) Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists

  const freshUser = await User.findById(decoded.id);

  if (!freshUser)
    throw new AppError(
      'The user belonging to this token does no longer exist.',
      401,
    );

  // 4) Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    throw new AppError(
      'User recently changed password! Please log in again.',
      401,
    );
  }
  // Anni conditions pass ayithe, lopaliki (next middleware ki) pampistham!
  req.user = freshUser; // Protected route lo req.user ni access chesukovachu, anduke req object lo user property create chestunnam
  res.locals.user = req.user;

  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    // console.log(roles, 'lll', req.user);
    // roles is an array ['admin', 'lead-guide'] role= admin, lead-guide, user
    if (!roles.includes(req.user.role))
      throw new AppError(
        'You do not have permission to perform this action',
        403,
      ); // 403 Forbidden{
    next();
  };
};

const forgotPassword = async (req, res) => {
  // 1) Get user based on POSTed email
  const { email } = req.body;
  if (!email) {
    throw new AppError('Please provide your email address.', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('There is no user with that email address.', 404);
  }

  // 2) Generate the random reset token and save hashed token to DB
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Construct Client-Facing Reset URL (Points to web UI route)
  const resetURL = `${req.protocol}://${req.get('host')}/resetPassword/${resetToken}`;

  // 4) Send token via Email Service
  try {
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email address!',
    });
  } catch (err) {
    // 🚨 Safe Rollback: Clear token fields if email delivery fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError(
      'There was an error sending the email. Try again later!',
      500,
    );
  }
};

const resetPassword = async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    throw new AppError('Token is invalid or has expired', 400);
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
};

const updatePassword = async (req, res) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    throw new AppError('Your current password is wrong.', 401);
  }
  // 3) If so, update password

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended! because it will not run the validators and pre save middleware, so we need to use user.save() instead of findByIdAndUpdate
  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
};

module.exports = {
  signUp,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
  isLoggedIn,
  logout,
};
