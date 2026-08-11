import type { Request, Response } from "express";

import { sendSuccess } from "../../lib/sendResponse.js";
import { catchAsync } from "../../lib/catchAsync.js";
import { AppError } from "../../lib/AppError.js";
import * as reviewService from "../../services/review/review.service.js";
import {
  createReviewSchema,
  updateReviewSchema,
  listReviewQuerySchema,
} from "../../services/review/review.validation.js";
import { validate, validateId } from "../../lib/validate.js";

export const createReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const input = validate(createReviewSchema, req.body);
  const productId = validateId(
    (req.body as Record<string, unknown>).productId,
  );
  const review = await reviewService.createReview(
    input,
    productId,
    req.user.id,
  );
  sendSuccess(res, "Review created successfully", review, 201);
});

export const getReviewsByProduct = catchAsync(
  async (req: Request, res: Response) => {
    const productId = validateId(
      (req.query as Record<string, unknown>).productId,
    );
    const filters = validate(listReviewQuerySchema, req.query);
    const result = await reviewService.getReviewsByProduct(productId, filters);
    sendSuccess(res, "Reviews retrieved successfully", result, 200);
  },
);

export const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const id = validateId(req.params.id);
  const review = await reviewService.getReviewById(id);
  sendSuccess(res, "Review retrieved successfully", review, 200);
});

export const updateReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const id = validateId(req.params.id);
  const input = validate(updateReviewSchema, req.body);
  const review = await reviewService.updateReview(id, input, req.user.id);
  sendSuccess(res, "Review updated successfully", review, 200);
});

export const deleteReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const id = validateId(req.params.id);
  const review = await reviewService.deleteReview(
    id,
    req.user.id,
    req.user.role === "ADMIN",
  );
  sendSuccess(res, "Review deleted successfully", review, 200);
});
