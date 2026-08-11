import type { Request, Response } from "express";

import { sendSuccess } from "../../lib/sendResponse.js";
import { catchAsync } from "../../lib/catchAsync.js";
import * as categoryService from "../../services/category/category.service.js";
import {
  validateCreateCategory,
  validateUpdateCategory,
  validateListCategories,
  validateId,
} from "../../services/category/category.validation.js";

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const input = validateCreateCategory(req.body);
  const category = await categoryService.createCategory(input);
  sendSuccess(res, "Category created successfully", category, 201);
});

export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const filters = validateListCategories(req.query);
  const result = await categoryService.getCategories(filters);
  sendSuccess(res, "Categories retrieved successfully", result, 200);
});

export const getCategoryById = catchAsync(
  async (req: Request, res: Response) => {
    const id = validateId(req.params.id);
    const category = await categoryService.getCategoryById(id);
    sendSuccess(res, "Category retrieved successfully", category, 200);
  },
);

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const id = validateId(req.params.id);
  const input = validateUpdateCategory(req.body);
  const category = await categoryService.updateCategory(id, input);
  sendSuccess(res, "Category updated successfully", category, 200);
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const id = validateId(req.params.id);
  const category = await categoryService.deleteCategory(id);
  sendSuccess(res, "Category deleted successfully", category, 200);
});
