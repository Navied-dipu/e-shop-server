import type { Response } from "express";

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data?: T;
}

export interface ApiError {
  success: false;
  message: string;
  error?: unknown;
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
): Response {
  const body: ApiSuccess<T> = data === undefined
    ? { success: true, message }
    : { success: true, message, data };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  error?: unknown,
  statusCode = 500,
): Response {
  const body: ApiError = error === undefined
    ? { success: false, message }
    : { success: false, message, error };
  return res.status(statusCode).json(body);
}
