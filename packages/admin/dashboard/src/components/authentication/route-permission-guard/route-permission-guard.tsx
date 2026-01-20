import { ExclamationCircle } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import {
  canAccessRoute,
  getRoutePermission,
  type Permission,
} from "../../../lib/permissions"
import { usePermissions } from "../../../providers/permissions-provider"

interface RoutePermissionGuardProps {
  /**
   * Optional explicit permissions to check for this route.
   * If not provided, permissions are inferred from the route path.
   */
  permissions?: Permission[]
  /**
   * If true, requires ALL permissions. Default is ANY.
   */
  requireAll?: boolean
  /**
   * Path to redirect to when access is denied.
   * If not provided, shows an access denied page.
   */
  redirectTo?: string
}

/**
 * Route-level permission guard that protects entire routes.
 * Can be used as a route element to wrap protected routes.
 *
 * @example
 * ```tsx
 * // In route definition
 * {
 *   path: "/customers/create",
 *   element: <RoutePermissionGuard permissions={["customer:create"]} />,
 *   children: [
 *     { path: "", lazy: () => import("./customer-create") }
 *   ]
 * }
 *
 * // Or using automatic permission inference
 * {
 *   path: "/customers/create",
 *   element: <RoutePermissionGuard />,
 *   children: [...]
 * }
 * ```
 */
export const RoutePermissionGuard = ({
  permissions,
  requireAll = false, // TODO: should be true by default ?
  redirectTo,
}: RoutePermissionGuardProps) => {
  const location = useLocation()
  const { policy, hasAnyPermission, hasAllPermissions, isLoading } =
    usePermissions()

  // Don't block while loading - TODO: reconsider this
  if (isLoading) {
    return <Outlet />
  }

  let hasAccess = false

  if (permissions?.length) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  } else {
    // Infer permissions from route
    hasAccess = canAccessRoute(policy, location.pathname)
  }

  if (!hasAccess) {
    // TODO: maybe just show button instead of immidate redirect
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />
    }

    // Show access denied page
    return <AccessDenied pathname={location.pathname} />
  }

  return <Outlet />
}

interface AccessDeniedProps {
  pathname: string
}

const AccessDenied = ({ pathname }: AccessDeniedProps) => {
  const { t } = useTranslation()
  const routePermission = getRoutePermission(pathname)

  return (
    <div className="bg-ui-bg-subtle absolute bottom-0 left-0 right-0 top-0 flex min-h-screen items-center justify-center p-4">
      <Container className="max-w-md">
        <div className="flex flex-col items-center gap-y-4 py-8 text-center">
          <div className="bg-ui-bg-subtle flex h-12 w-12 items-center justify-center rounded-full">
            <ExclamationCircle className="text-ui-fg-muted" />
          </div>
          <div className="flex flex-col gap-y-1">
            <Heading level="h2">{t("permissions.accessDenied.title")}</Heading>
            <Text className="text-ui-fg-subtle">
              {t("permissions.accessDenied.description")}
            </Text>
          </div>
          {routePermission && (
            <Text size="small" className="text-ui-fg-muted">
              {t("permissions.accessDenied.requiredPermission", {
                permission: `${routePermission.resource}:${routePermission.operation}`,
              })}
            </Text>
          )}
        </div>
      </Container>
    </div>
  )
}
