import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/AppError.js";
import { assertActive, softDelete, runUnique } from "../../lib/db.js";
import {
  buildPagination,
  toPaginatedResult,
} from "../../lib/pagination.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoryFilters,
} from "./category.validation.js";

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function assertParent(parentId: string | null | undefined): Promise<void> {
  if (!parentId) return;
  const parent = await prisma.category.findFirst({
    where: { id: parentId, isDeleted: false },
    select: { id: true },
  });
  if (!parent) {
    throw new AppError("Parent category not found", 400);
  }
}

export async function createCategory(input: CreateCategoryInput) {
  await assertParent(input.parentId ?? null);

  const data: Prisma.CategoryCreateInput = {
    name: input.name,
    slug: input.slug ?? slugify(input.name),
  };
  if (input.parentId !== undefined && input.parentId !== null) {
    data.parent = { connect: { id: input.parentId } };
  }

  return runUnique(
    () => prisma.category.create({ data, select: CATEGORY_SELECT }),
    "Category slug already exists",
  );
}

export async function getCategories(filters: ListCategoryFilters) {
  const { page, limit, skip } = buildPagination(filters.page, filters.limit);
  const where: Prisma.CategoryWhereInput = { isDeleted: false };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.parentId !== undefined) {
    where.parentId = filters.parentId;
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      select: CATEGORY_SELECT,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.count({ where }),
  ]);

  return toPaginatedResult(categories, total, page, limit);
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findFirst({
    where: { id, isDeleted: false },
    select: CATEGORY_SELECT,
  });
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return category;
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  await assertActive("category", id, "Category");

  if (input.parentId && input.parentId === id) {
    throw new AppError("Category cannot be its own parent", 400);
  }
  await assertParent(input.parentId ?? null);

  const data: Prisma.CategoryUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.parentId !== undefined) {
    data.parent =
      input.parentId === null ? { disconnect: true } : { connect: { id: input.parentId } };
  }

  return runUnique(
    () =>
      prisma.category.update({ where: { id }, data, select: CATEGORY_SELECT }),
    "Category slug already exists",
  );
}

export async function deleteCategory(id: string) {
  await assertActive("category", id, "Category");

  const hasChildren = await prisma.category.count({
    where: { parentId: id, isDeleted: false },
  });
  if (hasChildren > 0) {
    throw new AppError("Cannot delete category with child categories", 409);
  }

  await softDelete("category", id, "Category");
  return getCategoryById(id);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
