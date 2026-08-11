import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/AppError.js";
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

export interface PaginatedProducts {
  products: unknown[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function createProduct(
  input: CreateProductInput,
  sellerId: string,
) {
  const slug = input.slug ?? slugify(input.name);

  const categories = await prisma.category.findMany({
    where: { id: { in: input.categoryIds }, isDeleted: false },
    select: { id: true },
  });
  if (categories.length !== input.categoryIds.length) {
    throw new AppError("One or more categories not found", 400);
  }

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

  try {
    return await prisma.product.create({
      data,
      select: PRODUCT_SELECT,
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError("Product slug already exists", 409);
    }
    throw err;
  }
}

export async function getProducts(
  filters: ListProductQuery,
): Promise<PaginatedProducts> {
  const where: Prisma.ProductWhereInput = { isDeleted: false };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.sellerId) {
    where.sellerId = filters.sellerId;
  }
  if (filters.categoryId) {
    where.categories = {
      some: { categoryId: filters.categoryId, isDeleted: false },
    };
  }

  const skip = (filters.page - 1) * filters.limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: PRODUCT_SELECT,
      skip,
      take: filters.limit,
      orderBy: { [filters.sortBy]: filters.order },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    page: filters.page,
    limit: filters.limit,
    total,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findFirst({
    where: { id, isDeleted: false },
    select: {
      ...PRODUCT_SELECT,
      categories: {
        where: { isDeleted: false },
        select: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
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
  const existing = await prisma.product.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError("Product not found", 404);
  }

  const data: Prisma.ProductUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.status !== undefined) data.status = input.status;

  if (input.categoryIds !== undefined) {
    const categories = await prisma.category.findMany({
      where: { id: { in: input.categoryIds }, isDeleted: false },
      select: { id: true },
    });
    if (categories.length !== input.categoryIds.length) {
      throw new AppError("One or more categories not found", 400);
    }
    data.categories = {
      deleteMany: {}, // remove old links
      create: input.categoryIds.map((categoryId) => ({
        category: { connect: { id: categoryId } },
      })),
    };
  }

  try {
    return await prisma.product.update({
      where: { id },
      data,
      select: PRODUCT_SELECT,
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError("Product slug already exists", 409);
    }
    throw err;
  }
}

export async function deleteProduct(id: string) {
  const existing = await prisma.product.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError("Product not found", 404);
  }

  return prisma.product.update({
    where: { id },
    data: { isDeleted: true },
    select: PRODUCT_SELECT,
  });
}
