import NotificationModuleService from "#services/notification-module-service"
import loadProviders from "#loaders/providers"
import { Module, Modules } from "@medusajs/framework/utils"

export default Module(Modules.NOTIFICATION, {
  service: NotificationModuleService,
  loaders: [loadProviders],
})
