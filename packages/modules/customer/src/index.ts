import CustomerModuleService from "#services/customer-module"
import { Module, Modules } from "@medusajs/framework/utils"

export default Module(Modules.CUSTOMER, {
  service: CustomerModuleService,
})
