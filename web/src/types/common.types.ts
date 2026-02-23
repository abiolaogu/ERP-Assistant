export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface QueryParams {
  pagination?: Pagination;
  sort?: SortOrder;
  filters?: Record<string, unknown>;
}

export interface Pagination {
  current: number;
  pageSize: number;
}

export interface SortOrder {
  field: string;
  order: "asc" | "desc";
}
