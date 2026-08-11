import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/AppError.js";
import type { UserRole } from "../../generated/prisma/client.js";
import type { UpdateUserInput } from "./user.validation.js";

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface PaginatedUsers {
  users: unknown[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function getUsers(page = 1, limit = 10): Promise<PaginatedUsers> {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const skip = (safePage - 1) * safeLimit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { isDeleted: false },
      select: USER_SELECT,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { isDeleted: false } }),
  ]);

  return {
    users,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit),
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, isDeleted: false },
    select: USER_SELECT,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const existing = await prisma.user.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("User not found", 404);
  }

  return prisma.user.update({
    where: { id },
    data: input,
    select: USER_SELECT,
  });
}

export async function deleteUser(id: string) {
  const existing = await prisma.user.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("User not found", 404);
  }

  return prisma.user.update({
    where: { id },
    data: { isDeleted: true },
    select: USER_SELECT,
  });
}

export type { UserRole };
