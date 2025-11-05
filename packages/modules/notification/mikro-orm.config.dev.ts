import { NotificationProvider } from "#models/notification-provider"
import { Notification } from "#models/notification"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.NOTIFICATION, {
  entities: [NotificationProvider, Notification],
})
