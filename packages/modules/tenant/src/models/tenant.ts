import { model } from "@medusajs/framework/utils"

export enum TenantStatus {
  ACTIVE = "active",
  TRIAL = "trial",
  SUSPENDED = "suspended",
  DELETED = "deleted",
}

const Tenant = model
  .define("Tenant", {
    id: model.id({ prefix: "tenant" }).primaryKey(),
    name: model.text().searchable(),
    slug: model.text(),
    subdomain: model.text().nullable(),
    custom_domain: model.text().nullable(),
    status: model.enum(TenantStatus).default(TenantStatus.ACTIVE),
    
    // Configuration
    default_currency_code: model.text().default("usd"),
    default_region_id: model.text().nullable(),
    
    // Metadata
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_tenant_slug_unique",
      on: ["slug"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_tenant_subdomain_unique",
      on: ["subdomain"],
      unique: true,
      where: "deleted_at IS NULL AND subdomain IS NOT NULL",
    },
    {
      name: "IDX_tenant_custom_domain_unique",
      on: ["custom_domain"],
      unique: true,
      where: "deleted_at IS NULL AND custom_domain IS NOT NULL",
    },
    {
      name: "IDX_tenant_status",
      on: ["status"],
      unique: false,
    },
  ])

export default Tenant
