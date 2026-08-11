import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "./AppError.js";

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): Response {
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = "Resource already exists (unique constraint violation)";
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Resource not found";
    } else {
      statusCode = 400;
      message = err.message;
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "production" ? undefined : err,
  });
}
