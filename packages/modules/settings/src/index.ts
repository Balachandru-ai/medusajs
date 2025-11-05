import SettingsModuleService from "#services/settings-module-service"
import { Module } from "@medusajs/framework/utils"
import { Modules } from "@medusajs/utils"

export default Module(Modules.SETTINGS, {
  service: SettingsModuleService,
})
