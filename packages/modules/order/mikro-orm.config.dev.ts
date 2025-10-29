import { OrderAddress } from "#models/address"
import { OrderClaim } from "#models/claim"
import { OrderClaimItem } from "#models/claim-item"
import { OrderClaimItemImage } from "#models/claim-item-image"
import { OrderCreditLine } from "#models/credit-line"
import { OrderExchange } from "#models/exchange"
import { OrderExchangeItem } from "#models/exchange-item"
import { OrderLineItem } from "#models/line-item"
import { OrderLineItemAdjustment } from "#models/line-item-adjustment"
import { OrderLineItemTaxLine } from "#models/line-item-tax-line"
import { Order } from "#models/order"
import { OrderChange } from "#models/order-change"
import { OrderChangeAction } from "#models/order-change-action"
import { OrderItem } from "#models/order-item"
import { OrderShipping } from "#models/order-shipping-method"
import { OrderSummary } from "#models/order-summary"
import { Return } from "#models/return"
import { ReturnReason } from "#models/return-reason"
import { ReturnItem } from "#models/return-item"
import { OrderShippingMethod } from "#models/shipping-method"
import { OrderShippingMethodAdjustment } from "#models/shipping-method-adjustment"
import { OrderShippingMethodTaxLine } from "#models/shipping-method-tax-line"
import { OrderTransaction } from "#models/transaction"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.ORDER, {
  entities: [
    OrderAddress,
    OrderClaim,
    OrderExchange,
    OrderLineItem,
    Order,
    OrderChange,
    OrderItem,
    Return,
    ReturnReason,
    OrderShippingMethod,
    OrderTransaction,
    OrderCreditLine,
    OrderShipping,
    OrderSummary,
    OrderChangeAction,
    OrderClaimItem,
    OrderClaimItemImage,
    OrderExchangeItem,
    OrderLineItemAdjustment,
    OrderLineItemTaxLine,
    OrderShippingMethodAdjustment,
    OrderShippingMethodTaxLine,
    ReturnItem,
  ],
})
