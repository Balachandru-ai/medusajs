import StoreModuleService from "#services/store-module-service"
import { Module, Modules } from "@medusajs/framework/utils"

export default Module(Modules.STORE, {
  service: StoreModuleService,
})
