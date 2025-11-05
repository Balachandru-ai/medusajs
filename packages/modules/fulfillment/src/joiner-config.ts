import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import { Fulfillment } from "#models/fulfillment"
import { FulfillmentProvider } from "#models/fulfillment-provider"
import { FulfillmentSet } from "#models/fulfillment-set"
import { ShippingOption } from "#models/shipping-option"
import { ShippingOptionRule } from "#models/shipping-option-rule"
import { default as schema } from "#schema/index"

export const joinerConfig = defineJoinerConfig(Modules.FULFILLMENT, {
  schema,
  linkableKeys: {
    fulfillment_id: Fulfillment.name,
    fulfillment_set_id: FulfillmentSet.name,
    shipping_option_id: ShippingOption.name,
    shipping_option_rule_id: ShippingOptionRule.name,
    fulfillment_provider_id: FulfillmentProvider.name,
  },
})
