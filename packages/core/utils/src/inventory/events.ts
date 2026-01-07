import { EventOptions } from "@medusajs/types"
import { buildEventNamesFromEntityName } from "../event-bus"
import { Modules } from "../modules-sdk"

const eventBaseNames: ["inventoryItem", "reservationItem", "inventoryLevel"] = [
  "inventoryItem",
  "reservationItem",
  "inventoryLevel",
]

export const InventoryEvents = buildEventNamesFromEntityName(
  eventBaseNames,
  Modules.INVENTORY
)

type InventoryEventValues =
  (typeof InventoryEvents)[keyof typeof InventoryEvents]

declare module "@medusajs/types" {
  export interface EventBusEventsOptions
    extends Record<InventoryEventValues, EventOptions | undefined> {}
}
