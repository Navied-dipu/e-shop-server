import { AppError } from "../../lib/AppError.js";

export interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
}

export interface ListCategoryFilters {
  search: string | undefined;
  parentId: string | null | undefined;
  page: number;
  limit: number;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} must be a non-empty string`, 400);
  }
  return value.trim();
}

export function validateCreateCategory(body: unknown): CreateCategoryInput {
  if (typeof body !== "object" || body === null) {
    throw new AppError("Invalid request body", 400);
  }
  const data = body as Record<string, unknown>;

  const name = assertString(data.name, "name");
  let slug: string | undefined;
  if (data.slug !== undefined) {
    slug = assertString(data.slug, "slug");
  }
  const parentId =
    data.parentId === undefined || data.parentId === null
      ? null
      : assertString(data.parentId, "parentId");

  return {
    name,
    slug: slug ?? slugify(name),
    parentId,
  };
}

export function validateUpdateCategory(body: unknown): UpdateCategoryInput {
  if (typeof body !== "object" || body === null) {
    throw new AppError("Invalid request body", 400);
  }
  const data = body as Record<string, unknown>;
  const result: UpdateCategoryInput = {};

  if (data.name !== undefined) {
    result.name = assertString(data.name, "name");
  }
  if (data.slug !== undefined) {
    result.slug = assertString(data.slug, "slug");
  }
  if (data.parentId !== undefined) {
    result.parentId =
      data.parentId === null ? null : assertString(data.parentId, "parentId");
  }

  if (Object.keys(result).length === 0) {
    throw new AppError("No valid fields provided for update", 400);
  }

  return result;
}

export function validateListCategories(query: unknown): ListCategoryFilters {
  const q = (query ?? {}) as Record<string, unknown>;
  const page = Math.max(1, Math.floor(Number(q.page) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(q.limit) || 10)));

  let parentId: string | null | undefined;
  if (q.parentId !== undefined) {
    if (q.parentId === "null" || q.parentId === null) {
      parentId = null;
    } else if (typeof q.parentId === "string" && q.parentId.trim().length > 0) {
      parentId = q.parentId.trim();
    }
  }

  const search =
    typeof q.search === "string" && q.search.trim().length > 0
      ? q.search.trim()
      : undefined;

  return { search, parentId, page, limit };
}

export function validateId(id: unknown): string {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new AppError("Invalid id parameter", 400);
  }
  return id.trim();
}
