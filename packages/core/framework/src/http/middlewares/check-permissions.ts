import { dynamicImport, MedusaError } from "@medusajs/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareFunction,
} from "../types"

export type PolicyAction = {
  resource: string
  operation: string
}

/**
 * Wraps a middleware handler with RBAC permission checking.
 * Checks if the authenticated user has the required policies before executing the handler.
 *
 * @param handler - The original middleware handler to wrap
 * @param policies - Single policy or array of policies to check
 * @returns Wrapped middleware function that checks permissions first
 */
export function wrapWithPermissionCheck(
  handler: MiddlewareFunction,
  policies: PolicyAction | PolicyAction[]
): MiddlewareFunction {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    try {
      // Normalize policies to array
      const policyList = Array.isArray(policies) ? policies : [policies]

      if (!policyList.length) {
        return handler(req, res, next)
      }

      const authContext = req.auth_context
      // Get roles from JWT token's app_metadata
      const roleIds = (authContext.app_metadata?.roles as string[]) || []

      if (!roleIds.length) {
        return next(
          new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "User has no roles assigned"
          )
        )
      }

      // Dynamically import hasPermission from @medusajs/utils package
      const hasPermissionModule = await dynamicImport("@medusajs/medusa")
      const { hasPermission } = hasPermissionModule

      const hasAccess = await hasPermission({
        roles: roleIds,
        actions: policyList,
        container: req.scope,
      })

      if (!hasAccess) {
        const policyKeys = policyList
          .map((p) => `${p.resource}:${p.operation}`)
          .join(", ")

        return next(
          new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            `Insufficient permissions. Required policies: ${policyKeys}`
          )
        )
      }

      return handler(req, res, next)
    } catch (error) {
      return next(error)
    }
  }
}
