/**
 * Vỏ bọc chung cho mọi endpoint trả về danh sách có phân trang.
 * Frontend đọc `items` và dùng `total`/`totalPages` để vẽ nút chuyển trang.
 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Số trang tối thiểu là 1 để client luôn có ít nhất một trang để hiển thị. */
export function toPaginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Schema dùng lại trong @ApiOkResponse cho các endpoint phân trang. */
export const PAGINATED_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: { type: 'object' },
      description: 'Bản ghi của trang hiện tại',
    },
    total: { type: 'integer', example: 42, description: 'Tổng số bản ghi' },
    page: { type: 'integer', example: 1, description: 'Trang hiện tại' },
    limit: {
      type: 'integer',
      example: 12,
      description: 'Số bản ghi mỗi trang',
    },
    totalPages: { type: 'integer', example: 4, description: 'Tổng số trang' },
  },
} as const;
