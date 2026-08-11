const AppError = require('../utils/apiError');

// 1. DEVELOPMENT ERROR: Leak everything for debugging
const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack, // Stack trace helps developers find the exact line of the bug
    });
  }
  // Rendered website
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

// 2. PRODUCTION ERROR: Hide details, show only friendly messages
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: Send specific message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or unknown error: Don't leak error details
    else {
      // 1. Log the error to the console so developers can fix it later
      console.error('ERROR 💥', err);

      // 2. Send generic message to the client
      return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  } else {
    if (err.isOperational) {
      // Rendered website
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message,
      });
    }
    return res.status(500).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later.',
    });
  }
};

// 1. Handling Invalid IDs (CastError)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400); // 400 Bad Request status isthunnam
};

// 2. Handling Duplicate Database Fields (Code 11000)
const handleDuplicateFieldsDB = (err) => {
  // Regex vadi error message nunchi duplicate ayina peru ni extract chestunnam
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// 3. Handling Mongoose Validation Errors
const handleValidationErrorDB = (err) => {
  // Multiple errors unte (Ex: Name ledu, Price thappu), vaatన్నిటిని okate string ga kaluputhunnam
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = (err) =>
  new AppError('Your token has expired! Please log in again.', 401);

// ----------------------------------------------------
// THE GLOBAL ERROR HANDLER
// ----------------------------------------------------

// 4 parameters unte adi error handling middleware!
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // INTERCEPTION FILTERS (Error peru ni patti helper functions ki pamputham)

  if (err.name === 'CastError') {
    err = handleCastErrorDB(err);
  }

  if (err.code === 11000) {
    err = handleDuplicateFieldsDB(err);
  }

  if (err.name === 'ValidationError') {
    err = handleValidationErrorDB(err);
  }

  if (err.name === 'JsonWebTokenError') {
    err = handleJWTError(err);
  }
  if (err.name === 'TokenExpiredError') {
    err = handleJWTExpiredError(err);
  }

  // Environment ni batti yela respond avvalo decide chestunnam
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err);
    error.message = err.message;
    sendErrorProd(err, req, res);
  }
};

module.exports = globalErrorHandler;
