import {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { TENANT_MODULE } from "@medusajs/tenant"

/**
 * Tenant context middleware
 * 
 * Extracts tenant information from the request and validates it.
 * Supports multiple tenant resolution strategies:
 * 1. From JWT claim (for authenticated requests)
 * 2. From subdomain (e.g., acme.mystore.com)
 * 3. From X-Tenant-ID header (for API clients)
 * 4. From custom domain mapping
 * 
 * For PoC: We'll use a simple X-Tenant-ID header approach
 */
export async function tenantContext(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const tenantId = await extractTenantId(req)

    // For PoC, we allow requests without tenant_id (single-tenant mode)
    // In production, you'd enforce this based on configuration
    if (!tenantId) {
      // Allow pass-through for single-tenant mode or system endpoints
      return next()
    }

    // Validate tenant exists and is active
    const tenantService = req.scope.resolve(TENANT_MODULE)
    const tenant = await tenantService.retrieveTenant(tenantId)

    if (!tenant) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Tenant not found: ${tenantId}`
      )
    }

    if (tenant.status !== "active") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Tenant is ${tenant.status}`
      )
    }

    // Attach to request for use in routes
    req.tenantId = tenantId
    req.tenant = tenant

    // Register in scope for automatic repository filtering
    req.scope.register({
      tenantId: {
        resolve: () => tenantId,
      },
    })

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Extract tenant ID from request using various strategies
 */
async function extractTenantId(req: MedusaRequest): Promise<string | null> {
  // Strategy 1: From JWT claim (for authenticated requests)
  if (req.auth?.tenant_id) {
    return req.auth.tenant_id
  }

  // Strategy 2: From custom header (easiest for PoC testing)
  const headerTenantId = req.get("x-tenant-id")
  if (headerTenantId) {
    return headerTenantId
  }

  // Strategy 3: From subdomain (e.g., acme.mystore.com -> find tenant by subdomain)
  const hostname = req.get("host")
  if (hostname) {
    const subdomain = hostname.split(".")[0]
    if (subdomain && subdomain !== "www" && subdomain !== "localhost") {
      try {
        const tenantService = req.scope.resolve(TENANT_MODULE)
        const tenant = await tenantService.retrieveTenantBySubdomain(subdomain)
        return tenant?.id || null
      } catch (error) {
        // Tenant service might not be available, continue
      }
    }
  }

  // Strategy 4: From custom domain mapping
  if (hostname && hostname !== "localhost") {
    try {
      const tenantService = req.scope.resolve(TENANT_MODULE)
      const tenant = await tenantService.retrieveTenantByCustomDomain(hostname)
      return tenant?.id || null
    } catch (error) {
      // Tenant service might not be available, continue
    }
  }

  return null
}

/**
 * Declare module augmentation for MedusaRequest to include tenant fields
 */
declare module "@medusajs/framework/http" {
  interface MedusaRequest {
    tenantId?: string
    tenant?: {
      id: string
      name: string
      status: string
      slug: string
      subdomain?: string | null
      custom_domain?: string | null
      default_currency_code: string
      default_region_id?: string | null
      metadata?: Record<string, any> | null
    }
  }
}
