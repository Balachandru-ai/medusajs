import { EventOptions } from "@medusajs/types"
import { buildEventNamesFromEntityName } from "../event-bus"
import { Modules } from "../modules-sdk"

const eventBaseNames: [
  "product",
  "productVariant",
  "productOption",
  "productOptionValue",
  "productType",
  "productTag",
  "productCategory",
  "productCollection",
  "productImage"
] = [
  "product",
  "productVariant",
  "productOption",
  "productOptionValue",
  "productType",
  "productTag",
  "productCategory",
  "productCollection",
  "productImage",
]

export const ProductEvents = buildEventNamesFromEntityName(
  eventBaseNames,
  Modules.PRODUCT
)

type ProductEventValues = (typeof ProductEvents)[keyof typeof ProductEvents]

declare module "@medusajs/types" {
  export interface EventBusEventsOptions
    extends Record<ProductEventValues, EventOptions | undefined> {}
}
