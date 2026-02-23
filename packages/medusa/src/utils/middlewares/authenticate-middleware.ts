import { authenticate as originalAuthenticate } from "@medusajs/framework/http"
import { adminTenantIsolationMiddleware } from "../../api/admin-tenant-isolation-middleware"

export const authenticate = (
  scope: string | string[],
  authProviders: string | string[],
  options?: any
) => {
  const original = originalAuthenticate(scope, authProviders, options)

  // If it's an admin/user scope, append the isolation middleware
  if (
    (typeof scope === "string" && (scope === "user" || scope === "admin")) ||
    (Array.isArray(scope) && (scope.includes("user") || scope.includes("admin")))
  ) {
    return [original, adminTenantIsolationMiddleware]
  }

  return original
}
