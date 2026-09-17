import type { Session, User } from './types'

export const TOKEN_KEY = 'sfb_token'
export const USER_KEY = 'sfb_user'
export const SESSION_KEY = 'sfb_session'

function storage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

export function readToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null
}

export function readSession(): Session | null {
  const raw = storage()?.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as Session
    if (!session?.token || !session?.user) return null
    return session
  } catch {
    return null
  }
}

/**
 * Lưu phiên đăng nhập. Truyền `user = null` để chỉ lưu token (dùng ngay sau khi
 * đăng nhập, trước khi gọi `/users/me` — request() đọc token từ localStorage).
 */
export function saveSession(token: string, user: User | null) {
  const store = storage()
  if (!store) return
  store.setItem(TOKEN_KEY, token)
  if (!user) return
  store.setItem(USER_KEY, JSON.stringify(user))
  store.setItem(SESSION_KEY, JSON.stringify({ token, user } as Session))
}

export function clearSession() {
  const store = storage()
  if (!store) return
  store.removeItem(TOKEN_KEY)
  store.removeItem(USER_KEY)
  store.removeItem(SESSION_KEY)
}
