import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/AppError.js";
import { assertActive, softDelete, runUnique } from "../../lib/db.js";
import {
  buildPagination,
  toPaginatedResult,
} from "../../lib/pagination.js";
import type {
  CreateProductInput,
  UpdateProductInput,
  ListProductQuery,
} from "./product.validation.js";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  stock: true,
  status: true,
  sellerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function assertCategories(categoryIds: string[]): Promise<void> {
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds }, isDeleted: false },
    select: { id: true },
  });
  if (categories.length !== categoryIds.length) {
    throw new AppError("One or more categories not found", 400);
  }
}

export async function createProduct(
  input: CreateProductInput,
  sellerId: string,
) {
  await assertCategories(input.categoryIds);

  const slug = input.slug ?? slugify(input.name);
  const data: Prisma.ProductCreateInput = {
    name: input.name,
    slug,
    price: new Prisma.Decimal(input.price),
    stock: input.stock,
    status: input.status,
    seller: { connect: { id: sellerId } },
    categories: {
      create: input.categoryIds.map((categoryId) => ({
        category: { connect: { id: categoryId } },
      })),
    },
  };
  if (input.description !== undefined) {
    data.description = input.description;
  }

  return runUnique(
    () => prisma.product.create({ data, select: PRODUCT_SELECT }),
    "Product slug already exists",
  );
}

export async function getProducts(filters: ListProductQuery) {
  const { page, limit, skip } = buildPagination(filters.page, filters.limit);
  const where: Prisma.ProductWhereInput = { isDeleted: false };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.sellerId) where.sellerId = filters.sellerId;
  if (filters.categoryId) {
    where.categories = {
      some: { categoryId: filters.categoryId, isDeleted: false },
    };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: PRODUCT_SELECT,
      skip,
      take: limit,
      orderBy: { [filters.sortBy]: filters.order },
    }),
    prisma.product.count({ where }),
  ]);

  return toPaginatedResult(products, total, page, limit);
}

export async function getProductById(id: string) {
  const product = await prisma.product.findFirst({
    where: { id, isDeleted: false },
    select: {
      ...PRODUCT_SELECT,
      categories: {
        where: { isDeleted: false },
        select: { category: { select: { id: true, name: true, slug: true } } },
      },
      reviews: {
        where: { isDeleted: false },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await assertActive("product", id, "Product");

  const data: Prisma.ProductUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.status !== undefined) data.status = input.status;

  if (input.categoryIds !== undefined) {
    await assertCategories(input.categoryIds);
    data.categories = {
      deleteMany: {},
      create: input.categoryIds.map((categoryId) => ({
        category: { connect: { id: categoryId } },
      })),
    };
  }

  return runUnique(
    () =>
      prisma.product.update({ where: { id }, data, select: PRODUCT_SELECT }),
    "Product slug already exists",
  );
}

export async function deleteProduct(id: string) {
  await assertActive("product", id, "Product");
  await softDelete("product", id, "Product");
  return getProductById(id);
}
