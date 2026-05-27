export type PaginationInput = {
  page?: number;
  pageSize?: number;
  from?: Date | null;
  to?: Date | null;
};

export type Pagination = {
  page: number;
  pageSize: number;
  from: Date | null;
  to: Date | null;
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function validatePagination(input: PaginationInput): Pagination {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = input.from ?? null;
  const to = input.to ?? null;

  if (!Number.isInteger(page) || page < 1) {
    throw new Error('page must be a positive integer');
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new Error(`pageSize must be between 1 and ${MAX_PAGE_SIZE}`);
  }
  if (from && Number.isNaN(from.getTime())) {
    throw new Error('from must be a valid ISO-8601 timestamp');
  }
  if (to && Number.isNaN(to.getTime())) {
    throw new Error('to must be a valid ISO-8601 timestamp');
  }
  if (from && to && from.getTime() > to.getTime()) {
    throw new Error('from must be before or equal to to');
  }

  return { page, pageSize, from, to };
}
