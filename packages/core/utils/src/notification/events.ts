import { EventOptions } from "@medusajs/types"
import { buildEventNamesFromEntityName } from "../event-bus"
import { Modules } from "../modules-sdk"

const eventBaseNames: ["notification"] = ["notification"]

export const NotificationEvents = buildEventNamesFromEntityName(
  eventBaseNames,
  Modules.NOTIFICATION
)

declare module "@medusajs/types" {
  export interface EventBusEventsOptions {
    // Notification events
    [NotificationEvents.NOTIFICATION_CREATED]?: EventOptions
    [NotificationEvents.NOTIFICATION_UPDATED]?: EventOptions
    [NotificationEvents.NOTIFICATION_DELETED]?: EventOptions
    [NotificationEvents.NOTIFICATION_RESTORED]?: EventOptions
    [NotificationEvents.NOTIFICATION_ATTACHED]?: EventOptions
    [NotificationEvents.NOTIFICATION_DETACHED]?: EventOptions
  }
}
