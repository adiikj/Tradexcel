import { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

// Express only treats a middleware as an error handler if it declares all
// four params, so every thrown/next(error) in the app funnels through here
// and comes out as the same JSON shape ApiResponse uses for success.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
      data: err.data,
      success: false,
      errors: err.errors,
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    status: 500,
    message: "Internal Server Error",
    data: null,
    success: false,
    errors: [],
  });
};
