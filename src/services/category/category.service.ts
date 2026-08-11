import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/AppError.js";
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

export interface PaginatedCategories {
  categories: unknown[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function createCategory(input: CreateCategoryInput) {
  if (input.parentId) {
    const parent = await prisma.category.findFirst({
      where: { id: input.parentId, isDeleted: false },
      select: { id: true },
    });
    if (!parent) {
      throw new AppError("Parent category not found", 400);
    }
  }

  const data: { name: string; slug: string; parentId?: string | null } = {
    name: input.name,
    slug: input.slug,
  };
  if (input.parentId !== undefined) {
    data.parentId = input.parentId;
  }

  try {
    return await prisma.category.create({
      data,
      select: CATEGORY_SELECT,
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError("Category slug already exists", 409);
    }
    throw err;
  }
}

export async function getCategories(
  filters: ListCategoryFilters,
): Promise<PaginatedCategories> {
  const where: Record<string, unknown> = { isDeleted: false };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.parentId !== undefined) {
    where.parentId = filters.parentId;
  }

  const safePage = Math.max(1, Math.floor(filters.page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(filters.limit)));
  const skip = (safePage - 1) * safeLimit;

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      select: CATEGORY_SELECT,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.count({ where }),
  ]);

  return {
    categories,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit),
  };
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
  const existing = await prisma.category.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("Category not found", 404);
  }

  if (input.parentId && input.parentId === id) {
    throw new AppError("Category cannot be its own parent", 400);
  }

  if (input.parentId) {
    const parent = await prisma.category.findFirst({
      where: { id: input.parentId, isDeleted: false },
      select: { id: true },
    });
    if (!parent) {
      throw new AppError("Parent category not found", 400);
    }
  }

  const data: {
    name?: string;
    slug?: string;
    parentId?: string | null;
  } = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.parentId !== undefined) data.parentId = input.parentId;

  try {
    return await prisma.category.update({
      where: { id },
      data,
      select: CATEGORY_SELECT,
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError("Category slug already exists", 409);
    }
    throw err;
  }
}

export async function deleteCategory(id: string) {
  const existing = await prisma.category.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("Category not found", 404);
  }

  const hasChildren = await prisma.category.count({
    where: { parentId: id, isDeleted: false },
  });
  if (hasChildren > 0) {
    throw new AppError(
      "Cannot delete category with child categories",
      409,
    );
  }

  return prisma.category.update({
    where: { id },
    data: { isDeleted: true },
    select: CATEGORY_SELECT,
  });
}
