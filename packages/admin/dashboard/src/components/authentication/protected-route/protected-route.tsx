import { Spinner } from "@medusajs/icons"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useMe } from "../../../hooks/api/users"
import { useMyPermissions } from "../../../hooks/api/permissions"
import { PermissionsProvider } from "../../../providers/permissions-provider"
import { SearchProvider } from "../../../providers/search-provider"
import { SidebarProvider } from "../../../providers/sidebar-provider"

export const ProtectedRoute = () => {
  const { user, isLoading: isLoadingUser } = useMe({
    fields: "rbac_roles.*,rbac_roles.policies.*",
  })
  console.log("user", user)
  const { policy, isLoading: isLoadingPermissions } = useMyPermissions()
  const location = useLocation()

  const isLoading = isLoadingUser || isLoadingPermissions

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-ui-fg-interactive animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <PermissionsProvider policy={policy} isLoading={isLoadingPermissions}>
      <SidebarProvider>
        <SearchProvider>
          <Outlet />
        </SearchProvider>
      </SidebarProvider>
    </PermissionsProvider>
  )
}
