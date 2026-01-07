import { EventOptions } from "@medusajs/types"
import { buildEventNamesFromEntityName } from "../event-bus"
import { Modules } from "../modules-sdk"

const eventBaseNames: ["notification"] = ["notification"]

export const NotificationEvents = buildEventNamesFromEntityName(
  eventBaseNames,
  Modules.NOTIFICATION
)

type NotificationEventValues =
  (typeof NotificationEvents)[keyof typeof NotificationEvents]

declare module "@medusajs/types" {
  export interface EventBusEventsOptions
    extends Record<NotificationEventValues, EventOptions | undefined> {}
}
