const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;
  let code = err.publicCode || "REQUEST_FAILED";
  let details = err.details;

  if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    code = "RESOURCE_CONFLICT";
    message = "An account already exists with one or more of those details.";
    details = err.errors?.map((item) => ({ field: item.path, message: item.message }));
  } else if (err.name === "SequelizeValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "One or more account details are invalid.";
    details = err.errors?.map((item) => ({ field: item.path, message: item.message }));
  } else if (err.name === "SequelizeConnectionError") {
    statusCode = 503;
    code = "SERVICE_UNAVAILABLE";
    message = "The service is temporarily unavailable. Please try again shortly.";
  } else if (statusCode >= 500) {
    message = "We could not complete your request. Please try again shortly.";
    code = statusCode === 503 ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR";
    details = undefined;
  }

  res.locals.requestError = err;

  res.status(statusCode).json({
    success: false,
    code,
    message,
    ...(details ? { details } : {}),
    ...(err.retryAfterSeconds ? { retry_after_seconds: err.retryAfterSeconds } : {}),
    request_id: req.id,
  });
};

module.exports = { asyncHandler, notFound, errorHandler };
