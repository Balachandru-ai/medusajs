import Address from "#models/address"
import Cart from "#models/cart"
import CreditLine from "#models/credit-line"
import LineItemAdjustment from "#models/line-item-adjustment"
import LineItemTaxLine from "#models/line-item-tax-line"
import LineItem from "#models/line-item"
import ShippingMethodAdjustment from "#models/shipping-method-adjustment"
import ShippingMethodTaxLine from "#models/shipping-method-tax-line"
import ShippingMethod from "#models/shipping-method"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.CART, {
  entities: [
    Address,
    Cart,
    CreditLine,
    LineItemAdjustment,
    LineItemTaxLine,
    LineItem,
    ShippingMethodAdjustment,
    ShippingMethodTaxLine,
    ShippingMethod,
  ],
})
