import { ACTION_IMPLICATIONS, ROUTE_PERMISSIONS } from "./constants"
import type {
  Permission,
  PermissionAction,
  PermissionResource,
  UserPolicy,
} from "./types"

/**
 * Parse a permission string into its resource and action components.
 *
 * @param permission - Permission string in format "resource:action"
 * @returns Object with resource and action, or null if invalid
 */
export function parsePermission(permission: string): {
  resource: PermissionResource
  action: PermissionAction
} | null {
  const parts = permission.split(":")
  if (parts.length !== 2) {
    return null
  }

  const [resource, action] = parts

  return {
    resource: resource as PermissionResource,
    action: action as PermissionAction,
  }
}

/**
 * Build a permission string from resource and action.
 *
 * @param resource - The permission resource
 * @param action - The permission action
 * @returns Permission string
 */
export function buildPermission(
  resource: PermissionResource,
  action: PermissionAction
): Permission {
  return `${resource}:${action}` as Permission
}

/**
 * Check if an action is implied by another action.
 * For example, "manage" implies "read", "create", "update", "delete".
 *
 * @param grantedAction - The action the user has
 * @param requiredAction - The action being checked
 * @returns True if granted action implies required action
 */
export function actionImplies(
  grantedAction: PermissionAction,
  requiredAction: PermissionAction
): boolean {
  const impliedActions = ACTION_IMPLICATIONS[grantedAction] || [grantedAction]
  return impliedActions.includes(requiredAction)
}

/**
 * Check if a user's policy grants a specific permission.
 * Handles wildcards and manage permissions.
 *
 * @param policy - The user's policy
 * @param permission - The permission to check
 * @returns True if the policy grants the permission
 */
export function checkPermission(
  policy: UserPolicy | null,
  permission: Permission
): boolean {
  if (!policy || !policy.permissions || policy.permissions.length === 0) {
    return false
  }

  const parsed = parsePermission(permission)
  if (!parsed) {
    return false
  }

  const { resource: requiredResource, action: requiredAction } = parsed

  for (const granted of policy.permissions) {
    const grantedParsed = parsePermission(granted)
    if (!grantedParsed) {
      continue
    }

    const { resource: grantedResource, action: grantedAction } = grantedParsed

    // Check if resources match
    if (grantedResource !== requiredResource) {
      continue
    }

    // Check if action is granted (directly or via implication)
    if (actionImplies(grantedAction, requiredAction)) {
      return true
    }
  }

  return false
}

/**
 * Check if a user's policy grants any of the specified permissions.
 *
 * @param policy - The user's policy
 * @param permissions - Array of permissions to check
 * @returns True if any permission is granted
 */
export function checkAnyPermission(
  policy: UserPolicy | null,
  permissions: Permission[]
): boolean {
  if (!permissions || permissions.length === 0) {
    return true
  }

  return permissions.some((permission) => checkPermission(policy, permission))
}

/**
 * Check if a user's policy grants all of the specified permissions.
 *
 * @param policy - The user's policy
 * @param permissions - Array of permissions to check
 * @returns True if all permissions are granted
 */
export function checkAllPermissions(
  policy: UserPolicy | null,
  permissions: Permission[]
): boolean {
  if (!permissions || permissions.length === 0) {
    return true
  }

  return permissions.every((permission) => checkPermission(policy, permission))
}

/**
 * Check if a user can perform an action on a resource.
 * Convenience function that builds the permission string internally.
 *
 * @param policy - The user's policy
 * @param resource - The resource to check
 * @param action - The action to check
 * @returns True if the action is allowed
 */
export function can(
  policy: UserPolicy | null,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  const permission = buildPermission(resource, action)
  return checkPermission(policy, permission)
}

/**
 * Match a route path to its route pattern and return required permission.
 * Handles dynamic segments like :id.
 *
 * @param pathname - The current route pathname
 * @returns The required permission or null if no match
 */
export function getRoutePermission(pathname: string): {
  resource: PermissionResource
  action: PermissionAction
} | null {
  // First, try exact match
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname]
  }

  // Then, try pattern matching with dynamic segments
  for (const [pattern, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (matchRoutePattern(pathname, pattern)) {
      return permission
    }
  }

  return null
}

/**
 * Match a pathname against a route pattern with dynamic segments.
 *
 * @param pathname - The actual pathname
 * @param pattern - The route pattern (e.g., "/customers/:id")
 * @returns True if the pathname matches the pattern
 */
export function matchRoutePattern(pathname: string, pattern: string): boolean {
  const pathParts = pathname.split("/").filter(Boolean)
  const patternParts = pattern.split("/").filter(Boolean)

  if (pathParts.length !== patternParts.length) {
    return false
  }

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]

    // Dynamic segment (starts with :)
    if (patternPart.startsWith(":")) {
      continue
    }

    // Static segment must match exactly
    if (patternPart !== pathPart) {
      return false
    }
  }

  return true
}

/**
 * Check if a user can access a specific route based on their policy.
 *
 * @param policy - The user's policy
 * @param pathname - The route pathname to check
 * @returns True if access is allowed
 */
export function canAccessRoute(
  policy: UserPolicy | null,
  pathname: string
): boolean {
  const routePermission = getRoutePermission(pathname)

  // If no permission is defined for this route, allow access
  if (!routePermission) {
    return true
  }

  return can(policy, routePermission.resource, routePermission.action)
}

/**
 * Get all permissions for a resource.
 *
 * @param resource - The resource to get permissions for
 * @returns Array of all possible permissions for the resource
 */
export function getResourcePermissions(
  resource: PermissionResource
): Permission[] {
  const actions: PermissionAction[] = [
    "read",
    "create",
    "update",
    "delete",
    "manage",
  ]
  return actions.map((action) => buildPermission(resource, action))
}

/**
 * Filter an array of items based on permission requirements.
 *
 * @param items - Array of items with optional permission field
 * @param policy - The user's policy
 * @param getPermission - Function to extract permission from item
 * @returns Filtered array of items the user can access
 */
export function filterByPermission<T>(
  items: T[],
  policy: UserPolicy | null,
  getPermission: (item: T) => Permission | Permission[] | undefined
): T[] {
  return items.filter((item) => {
    const permission = getPermission(item)

    if (!permission) {
      return true
    }

    if (Array.isArray(permission)) {
      return checkAnyPermission(policy, permission)
    }

    return checkPermission(policy, permission)
  })
}
