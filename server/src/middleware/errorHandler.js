export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Server Error";
  let details;

  if (err.name === "ValidationError") {
    statusCode = 400;
    details = Object.values(err.errors).map((e) => e.message);
    message = "Validation failed";
  }

  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = "Invalid resource id";
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "A record with that value already exists";
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
}
