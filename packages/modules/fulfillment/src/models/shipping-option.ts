import { model, ShippingOptionPriceType } from "@medusajs/framework/utils"

import { Fulfillment } from "#models/fulfillment"
import { FulfillmentProvider } from "#models/fulfillment-provider"
import { ServiceZone } from "#models/service-zone"
import { ShippingOptionRule } from "#models/shipping-option-rule"
import { ShippingOptionType } from "#models/shipping-option-type"
import { ShippingProfile } from "#models/shipping-profile"

export const ShippingOption = model
  .define("shipping_option", {
    id: model.id({ prefix: "so" }).primaryKey(),
    name: model.text().searchable(),
    price_type: model
      .enum(ShippingOptionPriceType)
      .default(ShippingOptionPriceType.FLAT),
    data: model.json().nullable(),
    metadata: model.json().nullable(),
    service_zone: model.belongsTo(() => ServiceZone, {
      mappedBy: "shipping_options",
    }),
    shipping_profile: model
      .belongsTo(() => ShippingProfile, {
        mappedBy: "shipping_options",
      })
      .nullable(),
    provider: model.belongsTo(() => FulfillmentProvider).nullable(),
    type: model.hasOne(() => ShippingOptionType, {
      foreignKey: true,
      foreignKeyName: "shipping_option_type_id",
      mappedBy: undefined,
    }),
    rules: model.hasMany(() => ShippingOptionRule, {
      mappedBy: "shipping_option",
    }),
    fulfillments: model.hasMany(() => Fulfillment, {
      mappedBy: "shipping_option",
    }),
  })
  .cascades({
    delete: ["rules"],
  })
