import { AppError } from "../../lib/AppError.js";
import type { UserRole } from "../../generated/prisma/client.js";

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
}

export function validateUpdateUser(body: unknown): UpdateUserInput {
  if (typeof body !== "object" || body === null) {
    throw new AppError("Invalid request body", 400);
  }

  const data = body as Record<string, unknown>;
  const result: UpdateUserInput = {};

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim().length === 0) {
      throw new AppError("name must be a non-empty string", 400);
    }
    result.name = data.name.trim();
  }

  if (data.email !== undefined) {
    if (typeof data.email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      throw new AppError("email must be a valid email address", 400);
    }
    result.email = data.email.toLowerCase();
  }

  if (data.role !== undefined) {
    const allowed: UserRole[] = ["ADMIN", "USER", "MODERATOR"];
    if (typeof data.role !== "string" || !allowed.includes(data.role as UserRole)) {
      throw new AppError("role must be one of ADMIN, USER, MODERATOR", 400);
    }
    result.role = data.role as UserRole;
  }

  if (Object.keys(result).length === 0) {
    throw new AppError("No valid fields provided for update", 400);
  }

  return result;
}

export function validateId(id: unknown): string {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new AppError("Invalid id parameter", 400);
  }
  return id.trim();
}
