import type { Request, Response } from "express";

import { sendSuccess } from "../../lib/sendResponse.js";
import { catchAsync } from "../../lib/catchAsync.js";
import { AppError } from "../../lib/AppError.js";
import * as orderService from "../../services/order/order.service.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  listOrderQuerySchema,
} from "../../services/order/order.validation.js";
import { validate, validateId } from "../../lib/validate.js";

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const input = validate(createOrderSchema, req.body);
  const order = await orderService.createOrder(input, req.user.id);
  sendSuccess(res, "Order created successfully", order, 201);
});

export const getOrders = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const filters = validate(listOrderQuerySchema, req.query);
  const isAdmin = req.user.role === "ADMIN";
  const result = await orderService.getOrders(filters, req.user.id, isAdmin);
  sendSuccess(res, "Orders retrieved successfully", result, 200);
});

export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const id = validateId(req.params.id);
  const isAdmin = req.user.role === "ADMIN";
  const order = await orderService.getOrderById(id, req.user.id, isAdmin);
  sendSuccess(res, "Order retrieved successfully", order, 200);
});

export const updateOrderStatus = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Insufficient permissions", 403);
    }
    const id = validateId(req.params.id);
    const input = validate(updateOrderStatusSchema, req.body);
    const order = await orderService.updateOrderStatus(id, input);
    sendSuccess(res, "Order status updated successfully", order, 200);
  },
);

export const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const id = validateId(req.params.id);
  const isAdmin = req.user.role === "ADMIN";
  const order = await orderService.cancelOrder(id, req.user.id, isAdmin);
  sendSuccess(res, "Order cancelled successfully", order, 200);
});
