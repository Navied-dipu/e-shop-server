import { z } from "zod";

import { UserRole } from "../../generated/prisma/client.js";
import { validateId } from "../../lib/validate.js";

export const updateUserSchema = z.object({
  name: z.string().min(1, "name must be a non-empty string").max(255).optional(),
  email: z.string().email("email must be a valid email address").optional(),
  role: z.enum(["ADMIN", "USER", "MODERATOR"]).optional(),
});

export const listUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUserQuery = z.infer<typeof listUserQuerySchema>;

export { validateId };
export type { UserRole };
