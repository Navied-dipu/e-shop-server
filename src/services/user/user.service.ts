import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/AppError.js";
import { assertActive, softDelete } from "../../lib/db.js";
import {
  buildPagination,
  toPaginatedResult,
} from "../../lib/pagination.js";
import type { UpdateUserInput, ListUserQuery } from "./user.validation.js";

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getUsers(filters: ListUserQuery) {
  const { page, limit, skip } = buildPagination(filters.page, filters.limit);
  const where = { isDeleted: false };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return toPaginatedResult(users, total, page, limit);
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
  await assertActive("user", id, "User");
  const data: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) data.email = input.email.toLowerCase();
  if (input.role !== undefined) data.role = input.role;
  return prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });
}

export async function deleteUser(id: string) {
  await softDelete("user", id, "User");
  return getUserById(id);
}
