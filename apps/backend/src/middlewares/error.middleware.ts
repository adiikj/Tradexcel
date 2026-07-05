import { ErrorRequestHandler } from "express";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

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

  if (err instanceof multer.MulterError || (err instanceof Error && err.message.includes("images are allowed"))) {
    res.status(400).json({
      status: 400,
      message: err.message,
      data: null,
      success: false,
      errors: [],
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
