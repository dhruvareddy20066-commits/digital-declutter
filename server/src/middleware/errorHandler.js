import ApiError from '../utils/ApiError.js';

/** 404 fallback for any unmatched route. */
export const notFound = (_req, _res, next) => {
  next(new ApiError(404, 'Route not found'));
};

/** Central error middleware: every failure leaves as { success, message, errors }. */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    errors = [];
  } else if (err.name === 'ValidationError' && !err.isOperational) {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors || {}).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
    errors = [];
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body';
    errors = [];
  }

  if (statusCode >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Internal server error';
  }

  res.status(statusCode).json({ success: false, message, errors });
};
