import React, { createContext, useContext, useMemo } from "react"
import {
  useUserPermissions,
  Permission,
  PermissionsResponse,
} from "../../hooks/api/permissions"

interface PermissionsContextValue {
  permissions: Permission[]
  role: PermissionsResponse["role"]
  isLoading: boolean
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null)

export const usePermissions = (permissions: Permission[]): boolean => {
  const context = useContext(PermissionsContext)
  if (!context) {
    return false
  }
  return context.hasAnyPermission(permissions)
}

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error(
      "usePermissionsContext must be used within PermissionsProvider"
    )
  }

  return context
}

interface PermissionsProviderProps {
  children: React.ReactNode
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({
  children,
}) => {
  const { data, isLoading } = useUserPermissions()

  const value = useMemo(() => {
    const permissions = data?.permissions || []
    const role = data?.role || null

    const hasPermission = (permission: Permission): boolean => {
      // Check exact match
      if (permissions.includes(permission)) {
        return true
      }

      // manage wildcard
      const [resource] = permission.split(":")
      if (permissions.includes(`${resource}:manage`)) {
        return true
      }

      // "super admin" wildcard
      if (permissions.includes(`*:*`)) {
        return true
      }

      return false
    }

    const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.some((p) => hasPermission(p))
    }

    const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.every((p) => hasPermission(p))
    }

    return {
      permissions,
      role,
      isLoading,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    }
  }, [data, isLoading])

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}
