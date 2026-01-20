import type { PropsWithChildren, ReactNode } from "react"
import type {
  Permission,
  PermissionAction,
  PermissionResource,
} from "../../../lib/permissions"
import { usePermissions } from "../../../providers/permissions-provider"

interface BasePermissionGuardProps extends PropsWithChildren {
  /**
   * Content to render when permission is denied.
   * If not provided, nothing is rendered.
   */
  fallback?: ReactNode
  /**
   * If true, shows a loading state while permissions are being loaded.
   */
  showLoading?: boolean
  /**
   * Custom loading component.
   */
  loadingComponent?: ReactNode
}

interface PermissionGuardWithPermission extends BasePermissionGuardProps {
  /**
   * Single permission to check.
   */
  permission: Permission
  permissions?: never
  resource?: never
  action?: never
  requireAll?: never
}

interface PermissionGuardWithPermissions extends BasePermissionGuardProps {
  /**
   * Multiple permissions to check.
   */
  permissions: Permission[]
  /**
   * If true, requires ALL permissions. Default is ANY.
   */
  requireAll?: boolean
  permission?: never
  resource?: never
  action?: never
}

interface PermissionGuardWithResourceAction extends BasePermissionGuardProps {
  /**
   * Resource to check permission for.
   */
  resource: PermissionResource
  /**
   * Action to check permission for.
   */
  action: PermissionAction
  permission?: never
  permissions?: never
  requireAll?: never
}

export type PermissionGuardProps =
  | PermissionGuardWithPermission
  | PermissionGuardWithPermissions
  | PermissionGuardWithResourceAction

/**
 * Component that conditionally renders children based on user permissions.
 *
 * @example
 * ```tsx
 * // Using resource and action
 * <PermissionGuard resource="customer" action="create">
 *   <Button>Create Customer</Button>
 * </PermissionGuard>
 *
 * // Using permission string
 * <PermissionGuard permission="customer:read">
 *   <CustomerList />
 * </PermissionGuard>
 *
 * // Using multiple permissions (ANY)
 * <PermissionGuard permissions={["customer:update", "customer:manage"]}>
 *   <EditButton />
 * </PermissionGuard>
 *
 * // Using multiple permissions (ALL)
 * <PermissionGuard
 *   permissions={["customer:read", "order:read"]}
 *   requireAll
 * >
 *   <CustomerOrdersView />
 * </PermissionGuard>
 *
 * // With fallback
 * <PermissionGuard
 *   resource="customer"
 *   action="delete"
 *   fallback={<Text>You don't have permission to delete customers</Text>}
 * >
 *   <DeleteButton />
 * </PermissionGuard>
 * ```
 */
export const PermissionGuard = ({
  children,
  fallback = null,
  showLoading = false,
  loadingComponent = null,
  ...props
}: PermissionGuardProps) => {
  const { can, hasPermission, hasAnyPermission, hasAllPermissions, isLoading } =
    usePermissions()

  if (isLoading && showLoading) {
    return <>{loadingComponent}</>
  }

  let hasAccess = false

  if ("permission" in props && props.permission) {
    hasAccess = hasPermission(props.permission)
  } else if ("permissions" in props && props.permissions) {
    hasAccess = props.requireAll
      ? hasAllPermissions(props.permissions)
      : hasAnyPermission(props.permissions)
  } else if ("resource" in props && "action" in props) {
    hasAccess = can(props.resource, props.action)
  }

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
