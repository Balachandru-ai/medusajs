import RegionModuleService from "#services/region-module"
import loadDefaults from "#loaders/defaults"
import { Module, Modules } from "@medusajs/framework/utils"

export default Module(Modules.REGION, {
  service: RegionModuleService,
  loaders: [loadDefaults],
})
