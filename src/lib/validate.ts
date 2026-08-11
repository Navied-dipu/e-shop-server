import type { ZodSchema } from "zod";

import { AppError } from "./AppError.js";

export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join("; ");
    throw new AppError(message, 400);
  }
  return result.data;
}

export function validateId(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  throw new AppError("Invalid id parameter", 400);
}
