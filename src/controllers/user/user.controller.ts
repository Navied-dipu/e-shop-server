import type { Request, Response } from "express";

import { sendSuccess } from "../../lib/sendResponse.js";
import { catchAsync } from "../../lib/catchAsync.js";
import * as userService from "../../services/user/user.service.js";
import { validateUpdateUser, validateId } from "../../services/user/user.validation.js";

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await userService.getUsers(page, limit);
  sendSuccess(res, "Users retrieved successfully", result, 200);
});

export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const id = validateId(req.params.id);
  const user = await userService.getUserById(id);
  sendSuccess(res, "User retrieved successfully", user, 200);
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const id = validateId(req.params.id);
  const input = validateUpdateUser(req.body);
  const user = await userService.updateUser(id, input);
  sendSuccess(res, "User updated successfully", user, 200);
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = validateId(req.params.id);
  const user = await userService.deleteUser(id);
  sendSuccess(res, "User deleted successfully", user, 200);
});
