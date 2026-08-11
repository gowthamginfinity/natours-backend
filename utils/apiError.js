class AppError extends Error {
  constructor(message, statusCode) {
    // Parent class (Error) ki message ni pass chestunnam
    super(message);

    this.statusCode = statusCode;
    // Status code 4 tho start aythe 'fail', lekapothe 'error'
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Idi programming bug kadu, operational error ani cheppadaniki
    this.isOperational = true;

    // AppError class ni stack trace nunchi hide chestunnam
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
