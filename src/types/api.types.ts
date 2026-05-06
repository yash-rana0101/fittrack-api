/**
 * Standard API response envelope.
 * Every endpoint should return this shape for consistency.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T | undefined;
  error?: ApiErrorDetail | undefined;
  timestamp: string;
}

export interface ApiErrorDetail {
  code: string;
  details?: string | undefined;
  stack?: string | undefined;
}

/**
 * Pagination metadata returned with list endpoints.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}
