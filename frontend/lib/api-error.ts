export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (Array.isArray(message)) return message.filter(Boolean).join(', ')
    if (typeof message === 'string' && message) return message
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function normalizeApiError(body: unknown, status: number): ApiError {
  return new ApiError(getErrorMessage(body), status)
}

export function isMockMode() {
  return process.env.NEXT_PUBLIC_USE_MOCK === '1'
}
