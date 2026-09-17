'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { clearSession, readSession, readToken, saveSession } from '@/lib/session'
import type { User } from '@/lib/types'
type AuthContextValue = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<User>; register: (data: { email: string; password: string; name: string }) => Promise<User>; logout: () => void; refresh: () => Promise<void> }
const AuthContext = createContext<AuthContextValue | null>(null)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const session = readSession()
    if (!session) {
      setLoading(false)
      return
    }
    // Hiển thị ngay user đã lưu rồi xác thực lại token với server
    setUser(session.user)
    setLoading(false)
    api
      .me()
      .then(next => {
        setUser(next)
        saveSession(session.token, next)
      })
      .catch(() => {
        // request() đã xóa phiên và chuyển hướng khi token hết hạn
        setUser(null)
      })
  }, [])

  /**
   * P0: phải lưu token TRƯỚC khi gọi `/users/me`, vì request() lấy token từ
   * localStorage — nếu không mọi lần đăng nhập đều nhận 401.
   */
  const login = async (email: string, password: string) => {
    const { access_token } = await api.login(email, password)
    saveSession(access_token, null)
    const next = await api.me()
    saveSession(access_token, next)
    setUser(next)
    return next
  }

  const register = async (data: { email: string; password: string; name: string }) => {
    await api.register(data)
    return login(data.email, data.password)
  }

  const logout = () => {
    clearSession()
    setUser(null)
    router.push('/login')
  }

  const refresh = async () => {
    const next = await api.me()
    const token = readToken()
    if (token) saveSession(token, next)
    setUser(next)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context }
