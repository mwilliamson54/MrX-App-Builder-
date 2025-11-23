// lib/utils/pagination.ts
export function createPaginatedResponse<T>(
  data: T[],
  cursor?: string | number,
  hasMore: boolean = false,
  total?: number
) {
  return {
    data,
    cursor,
    hasMore,
    total
  };
}

export function parseCursor(cursor: string | null): number {
  if (!cursor) return 0;
  const parsed = parseInt(cursor, 10);
  return isNaN(parsed) ? 0 : parsed;
}

