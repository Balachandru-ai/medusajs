import { Spinner } from "@medusajs/icons"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useMe } from "../../../hooks/api/users"
import { SearchProvider } from "../../../providers/search-provider"
import { SidebarProvider } from "../../../providers/sidebar-provider"
import { usePermissionsContext } from "../../../providers/permissions-provider"

export const ProtectedRoute = ({
  requiredPermissions = [],
}: {
  requiredPermissions: string[]
}) => {
  const { user, isLoading } = useMe()
  const { hasAllPermissions, isLoading: isPermissionsLoading } =
    usePermissionsContext()
  const location = useLocation()

  if (isLoading || isPermissionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-ui-fg-interactive animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!hasAllPermissions(requiredPermissions)) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return (
    <SidebarProvider>
      <SearchProvider>
        <Outlet />
      </SearchProvider>
    </SidebarProvider>
  )
}
