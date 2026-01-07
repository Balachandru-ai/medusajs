import { EventOptions } from "@medusajs/types"
import { buildEventNamesFromEntityName } from "../event-bus"
import { Modules } from "../modules-sdk"

const eventBaseNames: [
  "priceListRule",
  "priceList",
  "priceRule",
  "priceSet",
  "price"
] = ["priceListRule", "priceList", "priceRule", "priceSet", "price"]

export const PricingEvents = buildEventNamesFromEntityName(
  eventBaseNames,
  Modules.PRICING
)

type PricingEventValues = (typeof PricingEvents)[keyof typeof PricingEvents]

declare module "@medusajs/types" {
  export interface EventBusEventsOptions
    extends Record<PricingEventValues, EventOptions | undefined> {}
}
