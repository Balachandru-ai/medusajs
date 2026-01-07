import { Module } from "@medusajs/framework/utils"
import { RbacModuleService } from "@services"

export default Module("rbac", {
  service: RbacModuleService,
})
