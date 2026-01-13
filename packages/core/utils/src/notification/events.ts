// TODO: Comment temporarely and we will re enable it in the near future
// import { EventOptions } from "@medusajs/types"
import { buildEventNamesFromEntityName } from "../event-bus"
import { Modules } from "../modules-sdk"

const eventBaseNames: ["notification"] = ["notification"]

export const NotificationEvents = buildEventNamesFromEntityName(
  eventBaseNames,
  Modules.NOTIFICATION
)

// TODO: Comment temporarely and we will re enable it in the near future
// declare module "@medusajs/types" {
//   export interface EventBusEventsOptions {
//     // Notification events
//     [NotificationEvents.NOTIFICATION_CREATED]?: EventOptions
//     [NotificationEvents.NOTIFICATION_UPDATED]?: EventOptions
//     [NotificationEvents.NOTIFICATION_DELETED]?: EventOptions
//     [NotificationEvents.NOTIFICATION_RESTORED]?: EventOptions
//     [NotificationEvents.NOTIFICATION_ATTACHED]?: EventOptions
//     [NotificationEvents.NOTIFICATION_DETACHED]?: EventOptions
//   }
// }
