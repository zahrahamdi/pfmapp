function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.statusCode === 400 && Array.isArray(err.errors) && err.errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message && err.message.includes('UNIQUE')) {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createValidationError(errors) {
  const error = new Error('Validation failed');
  error.statusCode = 400;
  error.errors = errors;
  return error;
}

function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: 'Route not found',
  });
}

module.exports = {
  asyncHandler,
  errorHandler,
  notFoundHandler,
  createHttpError,
  createValidationError,
};
