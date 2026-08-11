import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/AppError.js";
import { assertActive, runUnique } from "../../lib/db.js";
import {
  buildPagination,
  toPaginatedResult,
} from "../../lib/pagination.js";
import type {
  CreateReviewInput,
  UpdateReviewInput,
  ListReviewQuery,
} from "./review.validation.js";

const REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  productId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createReview(
  input: CreateReviewInput,
  productId: string,
  userId: string,
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isDeleted: false },
    select: { id: true },
  });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const existing = await prisma.review.findFirst({
    where: { productId, userId, isDeleted: false },
    select: { id: true },
  });
  if (existing) {
    throw new AppError("You have already reviewed this product", 409);
  }

  const data: Prisma.ReviewCreateInput = {
    rating: input.rating,
    product: { connect: { id: productId } },
    user: { connect: { id: userId } },
  };
  if (input.comment !== undefined) data.comment = input.comment;

  return runUnique(
    () => prisma.review.create({ data, select: REVIEW_SELECT }),
    "You have already reviewed this product",
  );
}

export async function getReviewsByProduct(
  productId: string,
  filters: ListReviewQuery,
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isDeleted: false },
    select: { id: true },
  });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const { page, limit, skip } = buildPagination(filters.page, filters.limit);
  const where: Prisma.ReviewWhereInput = { productId, isDeleted: false };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      select: REVIEW_SELECT,
      skip,
      take: limit,
      orderBy: { [filters.sortBy]: filters.order },
    }),
    prisma.review.count({ where }),
  ]);

  return toPaginatedResult(reviews, total, page, limit);
}

export async function getReviewById(id: string) {
  const review = await prisma.review.findFirst({
    where: { id, isDeleted: false },
    select: REVIEW_SELECT,
  });
  if (!review) {
    throw new AppError("Review not found", 404);
  }
  return review;
}

async function getOwnedReview(
  id: string,
): Promise<{ id: string; userId: string }> {
  const review = await prisma.review.findFirst({
    where: { id, isDeleted: false },
    select: { id: true, userId: true },
  });
  if (!review) {
    throw new AppError("Review not found", 404);
  }
  return review;
}

export async function updateReview(
  id: string,
  input: UpdateReviewInput,
  userId: string,
) {
  const review = await getOwnedReview(id);
  if (review.userId !== userId) {
    throw new AppError("You can only update your own review", 403);
  }

  const data: Prisma.ReviewUpdateInput = {};
  if (input.rating !== undefined) data.rating = input.rating;
  if (input.comment !== undefined) data.comment = input.comment;

  return prisma.review.update({
    where: { id },
    data,
    select: REVIEW_SELECT,
  });
}

export async function deleteReview(
  id: string,
  userId: string,
  isAdmin: boolean,
) {
  const review = await getOwnedReview(id);
  if (review.userId !== userId && !isAdmin) {
    throw new AppError("You can only delete your own review", 403);
  }

  return prisma.review.update({
    where: { id },
    data: { isDeleted: true },
    select: REVIEW_SELECT,
  });
}
