import { z } from "zod";

const orderStatusValues = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive("quantity must be >= 1"),
      }),
    )
    .min(1, "order must contain at least one item"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatusValues),
});

export const listOrderQuerySchema = z.object({
  status: z.enum(orderStatusValues).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "updatedAt", "total"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ListOrderQuery = z.infer<typeof listOrderQuerySchema>;
