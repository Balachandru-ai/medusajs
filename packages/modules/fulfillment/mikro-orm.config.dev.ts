import { Address } from "#models/address"
import { FulfillmentItem } from "#models/fulfillment-item"
import { FulfillmentLabel } from "#models/fulfillment-label"
import { FulfillmentProvider } from "#models/fulfillment-provider"
import { FulfillmentSet } from "#models/fulfillment-set"
import { Fulfillment } from "#models/fulfillment"
import { GeoZone } from "#models/geo-zone"
import { ServiceZone } from "#models/service-zone"
import { ShippingOptionRule } from "#models/shipping-option-rule"
import { ShippingOptionType } from "#models/shipping-option-type"
import { ShippingOption } from "#models/shipping-option"
import { ShippingProfile } from "#models/shipping-profile"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.FULFILLMENT, {
  entities: [
    Address,
    FulfillmentItem,
    FulfillmentLabel,
    FulfillmentProvider,
    FulfillmentSet,
    Fulfillment,
    GeoZone,
    ServiceZone,
    ShippingOptionRule,
    ShippingOptionType,
    ShippingOption,
    ShippingProfile,
  ],
})
