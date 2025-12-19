import { ReactNode } from "react"
import { usePermissions } from "../../../providers/permissions-provider"
import { Permission } from "../../../hooks/api/permissions"

type PermissionGuardProps = {
  permissions: Permission[]
  fallback?: ReactNode
  children: ReactNode
}

export const PermissionGuard = ({
  permissions,
  fallback = null,
  children,
}: PermissionGuardProps) => {
  const hasPermission = usePermissions(permissions)

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
