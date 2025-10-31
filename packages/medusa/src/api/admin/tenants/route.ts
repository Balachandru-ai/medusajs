import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TENANT_MODULE, CreateTenantDTO } from "@medusajs/tenant"
import { AdminCreateTenantType } from "./validators"

/**
 * POST /admin/tenants
 * Create a new tenant
 */
export const POST = async (
  req: MedusaRequest<AdminCreateTenantType>,
  res: MedusaResponse
) => {
  const tenantService = req.scope.resolve(TENANT_MODULE)

  const tenant = await tenantService.createTenants(
    req.validatedBody as CreateTenantDTO,
    {
      skipTenantScoping: true, // System operation
    }
  )

  res.status(201).json({ tenant })
}

/**
 * GET /admin/tenants
 * List all tenants
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const tenantService = req.scope.resolve(TENANT_MODULE)

  const [tenants, count] = await tenantService.listAndCountTenants(
    {},
    {},
    {
      skipTenantScoping: true, // System operation
    }
  )

  res.json({
    tenants,
    count,
    offset: 0,
    limit: count,
  })
}
