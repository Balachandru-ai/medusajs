import { buildEventNamesFromEntityName } from "../event-bus"
import { Modules } from "../modules-sdk"

const eventBaseNames: [
  "product",
  "productVariant",
  "productOption",
  "productProductOption",
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
  "productProductOption",
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
