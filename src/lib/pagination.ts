export interface PaginationInput {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function buildPagination(
  page: unknown,
  limit: unknown,
  max = 100,
): PaginationInput {
  const parsedPage = Math.floor(Number(page) || 1);
  const parsedLimit = Math.floor(Number(limit) || 10);
  const safePage = Math.max(1, parsedPage);
  const safeLimit = Math.min(max, Math.max(1, parsedLimit));
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

export function toPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
