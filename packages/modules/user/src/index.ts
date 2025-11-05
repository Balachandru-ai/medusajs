import UserModuleService from "#services/user-module"
import { Module, Modules } from "@medusajs/framework/utils"

export default Module(Modules.USER, {
  service: UserModuleService,
})
