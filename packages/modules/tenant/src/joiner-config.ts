import { defineJoinerConfig } from "@medusajs/framework/utils"

// Define a custom module name for tenant
export const TENANT_MODULE = "tenantService"

export const joinerConfig = defineJoinerConfig(TENANT_MODULE)
