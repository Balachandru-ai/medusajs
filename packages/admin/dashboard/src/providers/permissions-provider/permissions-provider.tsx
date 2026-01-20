import { PropsWithChildren, useCallback, useMemo } from "react"
import {
  buildPermission,
  can as canUtil,
  checkAllPermissions,
  checkAnyPermission,
  checkPermission,
  type Permission,
  type PermissionAction,
  type PermissionResource,
  type PermissionsContextValue,
  type UserPolicy,
} from "../../lib/permissions"
import { PermissionsContext } from "./permissions-context"

interface PermissionsProviderProps extends PropsWithChildren {
  /**
   * The user's policy containing their permissions.
   * This should be fetched from the backend and passed to the provider.
   */
  policy: UserPolicy | null
  /**
   * Whether the policy is currently being loaded.
   */
  isLoading?: boolean
}

export const PermissionsProvider = ({
  policy,
  isLoading = false,
  children,
}: PermissionsProviderProps) => {
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return checkPermission(policy, permission)
    },
    [policy]
  )

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return checkAnyPermission(policy, permissions)
    },
    [policy]
  )

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      return checkAllPermissions(policy, permissions)
    },
    [policy]
  )

  const can = useCallback(
    (resource: PermissionResource, action: PermissionAction): boolean => {
      return canUtil(policy, resource, action)
    },
    [policy]
  )

  const value: PermissionsContextValue = useMemo(
    () => ({
      policy,
      isLoading,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      can,
    }),
    [policy, isLoading, hasPermission, hasAnyPermission, hasAllPermissions, can]
  )

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}
