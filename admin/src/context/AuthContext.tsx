import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react"
import type { ReactNode } from "react"

import { medusa } from "../medusa"
import type { AdminUser, AdminAuthResponse } from "../types/medusa"

type AuthContextValue = {
  user: AdminUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Load session on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await medusa.client.fetch<AdminAuthResponse>("/admin/auth", {
          method: "GET",
        })
        setUser(res.user)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await medusa.client.fetch<AdminAuthResponse>("/admin/auth", {
        method: "POST",
        body: { email, password },
      })
      setUser(res.user)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await medusa.client.fetch("/admin/auth", {
        method: "DELETE",
      })
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}