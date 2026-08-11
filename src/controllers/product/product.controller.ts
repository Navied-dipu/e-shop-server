import type { Request, Response } from "express";

import { sendSuccess } from "../../lib/sendResponse.js";
import { catchAsync } from "../../lib/catchAsync.js";
import { AppError } from "../../lib/AppError.js";
import * as productService from "../../services/product/product.service.js";
import {
  createProductSchema,
  updateProductSchema,
  listProductQuerySchema,
} from "../../services/product/product.validation.js";
import { validate, validateId } from "../../lib/validate.js";

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const input = validate(createProductSchema, req.body);
  const product = await productService.createProduct(input, req.user.id);
  sendSuccess(res, "Product created successfully", product, 201);
});

export const getProducts = catchAsync(async (req: Request, res: Response) => {
  const filters = validate(listProductQuerySchema, req.query);
  const result = await productService.getProducts(filters);
  sendSuccess(res, "Products retrieved successfully", result, 200);
});

export const getProductById = catchAsync(
  async (req: Request, res: Response) => {
    const id = validateId(req.params.id);
    const product = await productService.getProductById(id);
    sendSuccess(res, "Product retrieved successfully", product, 200);
  },
);

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const id = validateId(req.params.id);
  const input = validate(updateProductSchema, req.body);
  const product = await productService.updateProduct(id, input);
  sendSuccess(res, "Product updated successfully", product, 200);
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const id = validateId(req.params.id);
  const product = await productService.deleteProduct(id);
  sendSuccess(res, "Product deleted successfully", product, 200);
});
