import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int("rating must be an integer")
    .min(1, "rating must be at least 1")
    .max(5, "rating must be at most 5"),
  comment: z.string().max(2000).optional(),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int("rating must be an integer")
    .min(1, "rating must be at least 1")
    .max(5, "rating must be at most 5")
    .optional(),
  comment: z.string().max(2000).optional(),
});

export const listReviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "rating"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ListReviewQuery = z.infer<typeof listReviewQuerySchema>;
