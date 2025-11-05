import FileModuleService from "#services/file-module-service"
import loadProviders from "./loaders/providers"
import { Module, Modules } from "@medusajs/framework/utils"

export default Module(Modules.FILE, {
  service: FileModuleService,
  loaders: [loadProviders],
})
