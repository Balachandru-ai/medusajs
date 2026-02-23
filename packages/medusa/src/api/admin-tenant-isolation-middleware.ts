import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IUserModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export async function adminTenantIsolationMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const tenant = (req as any).tenant
  const authContext = (req as any).auth_context

  // Only apply to admin routes and if a tenant is detected
  if (!req.path.startsWith("/admin") || !tenant) {
    return next()
  }

  // If not authenticated, let the auth middleware handle it
  if (!authContext || !authContext.actor_id) {
    return next()
  }

  const userModuleService: IUserModuleService = req.scope.resolve(Modules.USER)

  try {
    const user = await userModuleService.retrieveUser(authContext.actor_id)

    if (user && (user as any).store_id !== tenant.id) {
      return res.status(403).json({
        message: "You do not have access to this store.",
      })
    }
  } catch (error) {
    console.error("Error verifying admin tenant isolation:", error)
    return res.status(500).json({ message: "Internal server error" })
  }

  next()
}
