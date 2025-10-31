import { TenantModuleService } from "@services"
import { Module } from "@medusajs/framework/utils"
import { TENANT_MODULE } from "./joiner-config"

export default Module(TENANT_MODULE, {
  service: TenantModuleService,
})

export * from "./services/tenant-module"
export { Tenant, TenantStatus } from "./models"
