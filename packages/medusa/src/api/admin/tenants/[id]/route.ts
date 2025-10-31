import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TENANT_MODULE, UpdateTenantDTO } from "@medusajs/tenant"
import { AdminTenantParamsType, AdminUpdateTenantType } from "../validators"

/**
 * GET /admin/tenants/:id
 * Get a tenant by ID
 */
export const GET = async (
  req: MedusaRequest<{}, AdminTenantParamsType>,
  res: MedusaResponse
) => {
  const tenantService = req.scope.resolve(TENANT_MODULE)

  const tenant = await tenantService.retrieveTenant(
    req.params.id,
    {},
    {
      skipTenantScoping: true,
    }
  )

  res.json({ tenant })
}

/**
 * POST /admin/tenants/:id
 * Update a tenant
 */
export const POST = async (
  req: MedusaRequest<AdminUpdateTenantType, AdminTenantParamsType>,
  res: MedusaResponse
) => {
  const tenantService = req.scope.resolve(TENANT_MODULE)

  const tenant = await tenantService.updateTenants(
    req.params.id,
    req.validatedBody as UpdateTenantDTO,
    {
      skipTenantScoping: true,
    }
  )

  res.json({ tenant })
}

/**
 * DELETE /admin/tenants/:id
 * Delete a tenant (soft delete)
 */
export const DELETE = async (
  req: MedusaRequest<{}, AdminTenantParamsType>,
  res: MedusaResponse
) => {
  const tenantService = req.scope.resolve(TENANT_MODULE)

  await tenantService.deleteTenants(req.params.id, {
    skipTenantScoping: true,
  })

  res.status(200).json({
    id: req.params.id,
    object: "tenant",
    deleted: true,
  })
}
