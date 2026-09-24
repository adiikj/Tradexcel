import { ErrorRequestHandler } from "express";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";

export const SERVER_ERROR_MESSAGE = "Something went wrong on our side. Please try again in a moment.";

// Upload problems in words a user can act on.
const UPLOAD_MESSAGES: Partial<Record<multer.ErrorCode, string>> = {
  LIMIT_FILE_SIZE: "That image is too large. Please choose one under 5 MB.",
  LIMIT_FILE_COUNT: "Please upload one image at a time.",
  LIMIT_UNEXPECTED_FILE: "Please upload one image at a time.",
};

// Every error reaches the client as `{ message }` in plain language. Internal
// details (validation internals, stack traces, library messages) are only
// ever logged on the server.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let status = 500;
  let message = SERVER_ERROR_MESSAGE;

  if (err instanceof ApiError) {
    status = err.statusCode;
    // Every ApiError message is written for users (see ApiError's default).
    message = err.message || SERVER_ERROR_MESSAGE;
    if (status >= 500) logger.error({ err, path: req.path }, "Request failed");
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = UPLOAD_MESSAGES[err.code] ?? "We couldn't read that image. Please try another one.";
  } else if (err instanceof Error && err.message.includes("images are allowed")) {
    status = 400;
    message = "Please choose a JPEG, PNG, WEBP or GIF image.";
  } else if (err?.type === "entity.too.large") {
    status = 413;
    message = "That request was too large. Please try again with less data.";
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    message = "We couldn't read that request. Please try again.";
  } else {
    logger.error({ err, path: req.path }, "Unhandled error");
  }

  res.status(status).json({ status, message, data: null, success: false, errors: [] });
};
