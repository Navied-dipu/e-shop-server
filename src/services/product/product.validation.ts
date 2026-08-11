import { z } from "zod";

import { ProductStatus } from "../../generated/prisma/client.js";

const productStatusValues = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export const createProductSchema = z.object({
  name: z.string().min(1, "name is required").max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case")
    .optional(),
  description: z.string().max(5000).optional(),
  price: z.number().nonnegative("price must be >= 0"),
  stock: z.number().int().nonnegative("stock must be >= 0").default(0),
  status: z.enum(productStatusValues).default("DRAFT"),
  categoryIds: z.array(z.string().min(1)).min(1, "at least one category required"),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case")
    .optional(),
  description: z.string().max(5000).optional(),
  price: z.number().nonnegative("price must be >= 0").optional(),
  stock: z.number().int().nonnegative("stock must be >= 0").optional(),
  status: z.enum(productStatusValues).optional(),
  categoryIds: z.array(z.string().min(1)).min(1).optional(),
});

export const listProductQuerySchema = z.object({
  search: z.string().max(255).optional(),
  categoryId: z.string().min(1).optional(),
  status: z.enum(productStatusValues).optional(),
  sellerId: z.string().min(1).optional(),
  sortBy: z.enum(["createdAt", "price", "name", "updatedAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductQuery = z.infer<typeof listProductQuerySchema>;

export { ProductStatus };
