import { z } from "zod"

export const AdminCreateTenant = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  subdomain: z.string().optional(),
  custom_domain: z.string().optional(),
  status: z.enum(["active", "trial", "suspended", "deleted"]).optional(),
  default_currency_code: z.string().optional(),
  default_region_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export type AdminCreateTenantType = z.infer<typeof AdminCreateTenant>

export const AdminUpdateTenant = z.object({
  name: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  subdomain: z.string().optional(),
  custom_domain: z.string().optional(),
  status: z.enum(["active", "trial", "suspended", "deleted"]).optional(),
  default_currency_code: z.string().optional(),
  default_region_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export type AdminUpdateTenantType = z.infer<typeof AdminUpdateTenant>

export const AdminTenantParams = z.object({
  id: z.string(),
})

export type AdminTenantParamsType = z.infer<typeof AdminTenantParams>
