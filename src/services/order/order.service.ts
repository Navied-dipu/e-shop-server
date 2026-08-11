import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/AppError.js";
import { assertActive, softDelete } from "../../lib/db.js";
import {
  buildPagination,
  toPaginatedResult,
} from "../../lib/pagination.js";
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  ListOrderQuery,
} from "./order.validation.js";

const ORDER_SELECT = {
  id: true,
  status: true,
  total: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: { id: true, quantity: true, unitPrice: true, productId: true },
  },
} as const;

export async function createOrder(input: CreateOrderInput, userId: string) {
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isDeleted: false },
    select: { id: true, price: true, stock: true },
  });

  if (products.length !== productIds.length) {
    throw new AppError("One or more products not found", 400);
  }

  const priceById = new Map(products.map((p) => [p.id, p.price]));
  const items = input.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: priceById.get(item.productId)!,
  }));
  const total = items.reduce(
    (sum, i) => sum.add(i.unitPrice.mul(i.quantity)),
    new Prisma.Decimal(0),
  );

  return prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        userId,
        total,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      },
      select: ORDER_SELECT,
    });
  });
}

export async function getOrders(
  filters: ListOrderQuery,
  userId: string,
  isAdmin: boolean,
) {
  const { page, limit, skip } = buildPagination(filters.page, filters.limit);
  const where: Prisma.OrderWhereInput = { isDeleted: false };
  if (!isAdmin) where.userId = userId;
  if (filters.status) where.status = filters.status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: ORDER_SELECT,
      skip,
      take: limit,
      orderBy: { [filters.sortBy]: filters.order },
    }),
    prisma.order.count({ where }),
  ]);

  return toPaginatedResult(orders, total, page, limit);
}

export async function getOrderById(
  id: string,
  userId: string,
  isAdmin: boolean,
) {
  const order = await prisma.order.findFirst({
    where: { id, isDeleted: false },
    select: ORDER_SELECT,
  });
  if (!order) {
    throw new AppError("Order not found", 404);
  }
  if (!isAdmin && order.userId !== userId) {
    throw new AppError("You can only view your own orders", 403);
  }
  return order;
}

export async function updateOrderStatus(
  id: string,
  input: UpdateOrderStatusInput,
) {
  await assertActive("order", id, "Order");
  return prisma.order.update({
    where: { id },
    data: { status: input.status },
    select: ORDER_SELECT,
  });
}

export async function cancelOrder(
  id: string,
  userId: string,
  isAdmin: boolean,
) {
  const existing = await prisma.order.findFirst({
    where: { id, isDeleted: false },
    select: { id: true, userId: true },
  });
  if (!existing) {
    throw new AppError("Order not found", 404);
  }
  if (!isAdmin && existing.userId !== userId) {
    throw new AppError("You can only cancel your own orders", 403);
  }

  return prisma.order.update({
    where: { id },
    data: { isDeleted: true, status: "CANCELLED" },
    select: ORDER_SELECT,
  });
}
