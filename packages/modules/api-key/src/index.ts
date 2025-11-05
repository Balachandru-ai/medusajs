import { Module, Modules } from "@medusajs/framework/utils"
import { ApiKeyModuleService } from "#services/api-key-module-service"

export default Module(Modules.API_KEY, {
  service: ApiKeyModuleService,
})
