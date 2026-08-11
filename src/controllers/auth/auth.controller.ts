import type { Request, Response } from "express";

import { sendSuccess } from "../../lib/sendResponse.js";
import { catchAsync } from "../../lib/catchAsync.js";
import * as authService from "../../services/auth/auth.service.js";
import { registerSchema, loginSchema } from "../../services/auth/auth.validation.js";
import { validate } from "../../lib/validate.js";

export const register = catchAsync(async (req: Request, res: Response) => {
  const input = validate(registerSchema, req.body);
  const result = await authService.register(input);
  sendSuccess(res, "User registered successfully", result, 201);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const input = validate(loginSchema, req.body);
  const result = await authService.login(input);
  sendSuccess(res, "Login successful", result, 200);
});
