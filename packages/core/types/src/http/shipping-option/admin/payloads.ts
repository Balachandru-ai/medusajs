import { RuleOperatorType } from "../../../common"
import { ShippingOptionPriceType } from "../../../fulfillment"
import { PriceRule } from "../../../pricing"

export interface AdminCreateShippingOptionRule {
  /**
   * The operator of the shipping option rule.
   */
  operator: RuleOperatorType
  /**
   * The attribute of the shipping option rule.
   *
   * @example
   * `enabled_in_store`
   */
  attribute: string
  /**
   * The value of the shipping option rule.
   *
   * @example
   * `true`
   */
  value: string | string[]
}

export interface AdminCreateShippingOptionType {
  /**
   * The label of the shipping option type.
   */
  label: string
  /**
   * The description of the shipping option type.
   */
  description?: string
  /**
   * The code of the shipping option type.
   */
  code: string
}

export interface AdminUpdateShippingOptionType {
  /**
   * The label of the shipping option type.
   */
  label?: string
  /**
   * The description of the shipping option type.
   */
  description?: string
  /**
   * The code of the shipping option type.
   */
  code?: string
}

interface AdminShippingOptionPriceWithRules {
  /**
   * The rules of the shipping option price that
   * indicate when the price should be applied.
   */
  rules?: PriceRule[]
}

export interface AdminCreateShippingOptionPriceWithCurrency
  extends AdminShippingOptionPriceWithRules {
  /**
   * The currency code of the shipping option price.
   *
   * @example
   * "usd"
   */
  currency_code: string
  /**
   * The amount of the shipping option price.
   */
  amount: number
}

export interface AdminCreateShippingOptionPriceWithRegion
  extends AdminShippingOptionPriceWithRules {
  /**
   * The ID of the region that the shipping option price belongs to.
   */
  region_id: string
  /**
   * The amount of the shipping option price.
   */
  amount: number
}

export interface AdminCreateFlatRateShippingOption {
  /**
   * The name of the shipping option.
   */
  name: string

  /**
   * The ID of the service zone that the shipping option belongs to.
   */
  service_zone_id: string

  /**
   * The ID of the shipping profile that the shipping option belongs to.
   */
  shipping_profile_id: string

  /**
   * Additional data for third-party fulfillment providers.
   */
  data?: Record<string, unknown>

  /**
   * Flat rate type.
   */
  price_type: "flat"

  /**
   * The ID of the fulfillment provider.
   */
  provider_id: string

  /**
   * The type of shipping option.
   */
  type?: AdminCreateShippingOptionType

  /**
   * The ID of the type of shipping option.
   */
  type_id?: string

  /**
   * Prices are **required** for flat-rate.
   */
  prices: (
    | AdminCreateShippingOptionPriceWithCurrency
    | AdminCreateShippingOptionPriceWithRegion
  )[]

  /**
   * Rules for when this option is applied.
   */
  rules?: AdminCreateShippingOptionRule[]

  /**
   * Custom metadata.
   */
  metadata?: Record<string, unknown>
}

export interface AdminCreateCalculatedShippingOption {
  /**
   * The name of the shipping option.
   */
  name: string

  /**
   * The ID of the service zone that the shipping option belongs to.
   */
  service_zone_id: string

  /**
   * The ID of the shipping profile that the shipping option belongs to.
   */
  shipping_profile_id: string

  /**
   * Additional data for third-party fulfillment providers.
   */
  data?: Record<string, unknown>

  /**
   * Calculated type.
   */
  price_type: "calculated"

  /**
   * The ID of the fulfillment provider.
   */
  provider_id: string

  /**
   * The type of shipping option.
   */
  type?: AdminCreateShippingOptionType

  /**
   * The ID of the type of shipping option.
   */
  type_id?: string

  /**
   * No prices here — provider calculates cost.
   */
  rules?: AdminCreateShippingOptionRule[]

  /**
   * Custom metadata.
   */
  metadata?: Record<string, unknown>
}

export type AdminCreateShippingOption =
  | AdminCreateFlatRateShippingOption
  | AdminCreateCalculatedShippingOption

export interface AdminUpdateShippingOptionRule
  extends AdminCreateShippingOptionRule {
  /**
   * The ID of the shipping option rule that is being updated.
   */
  id: string
}

export interface AdminUpdateShippingOptionPriceWithCurrency
  extends AdminShippingOptionPriceWithRules {
  /**
   * The ID of the shipping option price that is being updated.
   * If not provided, a new shipping option price will be created.
   */
  id?: string
  /**
   * The currency code of the shipping option price.
   *
   * @example
   * "usd"
   */
  currency_code?: string
  /**
   * The amount of the shipping option price.
   */
  amount?: number
}

export interface AdminUpdateShippingOptionPriceWithRegion
  extends AdminShippingOptionPriceWithRules {
  /**
   * The ID of the shipping option price that is being updated.
   * If not provided, a new shipping option price will be created.
   */
  id?: string
  /**
   * The ID of the region that the shipping option price belongs to.
   */
  region_id?: string
  /**
   * The amount of the shipping option price.
   */
  amount?: number
}

export interface AdminUpdateShippingOption {
  /**
   * The name of the shipping option. Customers can
   * view this name during checkout.
   *
   * @example
   * "Standard Shipping"
   */
  name?: string
  /**
   * Additional data that is useful for third-party fulfillment providers
   * that process fulfillments for the shipping option.
   */
  data?: Record<string, unknown>
  /**
   * The type of shipping option's price.
   */
  price_type?: ShippingOptionPriceType
  /**
   * The ID of the fulfillment provider that the shipping option belongs to.
   */
  provider_id?: string
  /**
   * The ID of the shipping profile that the shipping option belongs to.
   *
   * Learn more in the [Shipping Options](https://docs.medusajs.com/resources/commerce-modules/fulfillment/shipping-option#shipping-profile-and-types)
   * documentation.
   */
  shipping_profile_id?: string
  /**
   * The type of shipping option.
   *
   * Learn more in the [Shipping Options](https://docs.medusajs.com/resources/commerce-modules/fulfillment/shipping-option#shipping-profile-and-types)
   * documentation.
   */
  type?: AdminCreateShippingOptionType
  /**
   * The ID of the type of shipping option.
   *
   * Learn more in the [Shipping Option](https://docs.medusajs.com/resources/commerce-modules/fulfillment/shipping-option#shipping-profile-and-types)
   * documentation.
   */
  type_id?: string
  /**
   * The prices of the shipping option.
   */
  prices?: (
    | AdminUpdateShippingOptionPriceWithCurrency
    | AdminUpdateShippingOptionPriceWithRegion
  )[]
  /**
   * The rules of the shipping option.
   *
   * Learn more in the [Shipping Option Rules](https://docs.medusajs.com/resources/commerce-modules/fulfillment/shipping-option#shipping-option-rules)
   * documentation.
   */
  rules?: (AdminUpdateShippingOptionRule | AdminCreateShippingOptionRule)[]
  /**
   * Custom key-value pairs that can be added to the shipping option.
   */
  metadata?: Record<string, unknown>
}

export interface AdminUpdateShippingOptionRules {
  /**
   * The rules to create.
   */
  create?: any[]
  /**
   * The rules to update.
   */
  update?: any[]
  /**
   * The rules to delete.
   */
  delete?: string[]
}
