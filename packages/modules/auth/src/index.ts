import AuthModuleService from "#services/auth-module"
import loadProviders from "./loaders/providers"
import { Module, Modules } from "@medusajs/framework/utils"

export default Module(Modules.AUTH, {
  service: AuthModuleService,
  loaders: [loadProviders],
})
