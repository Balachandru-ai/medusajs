import { Module, Modules } from "@medusajs/framework/utils"
import ProductModuleService from "#services/product-module-service"

export default Module(Modules.PRODUCT, {
  service: ProductModuleService,
})
