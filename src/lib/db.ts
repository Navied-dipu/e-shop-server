import { Prisma } from "../generated/prisma/client.js";

import { prisma } from "./prisma.js";
import { AppError } from "./AppError.js";

const ACTIVE_WHERE = { isDeleted: false } as const;

export { ACTIVE_WHERE };

export function notFound(model: string): AppError {
  return new AppError(`${model} not found`, 404);
}

type FindFirstDelegate = {
  findFirst: (args: unknown) => Promise<{ id: string } | null>;
};
type UpdateDelegate = {
  update: (args: unknown) => Promise<unknown>;
};

function delegate(name: string): FindFirstDelegate & UpdateDelegate {
  const found = (prisma as unknown as Record<string, FindFirstDelegate & UpdateDelegate>)[
    name
  ];
  if (!found) {
    throw new AppError(`Unknown model delegate: ${name}`, 500);
  }
  return found;
}

export async function assertActive(
  model: keyof typeof prisma,
  id: string,
  label: string,
): Promise<{ id: string }> {
  const record = await delegate(model as string).findFirst({
    where: { id, ...ACTIVE_WHERE },
    select: { id: true },
  });
  if (!record) {
    throw notFound(label);
  }
  return record;
}

export async function softDelete(
  model: keyof typeof prisma,
  id: string,
  label: string,
): Promise<void> {
  await assertActive(model, id, label);
  await delegate(model as string).update({
    where: { id },
    data: { isDeleted: true },
  });
}

export async function runUnique<T>(
  fn: () => Promise<T>,
  message = "Resource already exists",
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError(message, 409);
    }
    throw err;
  }
}
