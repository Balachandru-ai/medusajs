import { OrderAddress } from "#models/address"
import { OrderClaim } from "#models/claim"
import { OrderExchange } from "#models/exchange"
import { OrderLineItem } from "#models/line-item"
import { Order } from "#models/order"
import { OrderChange } from "#models/order-change"
import { OrderItem } from "#models/order-item"
import { Return } from "#models/return"
import { ReturnReason } from "#models/return-reason"
import { OrderShippingMethod } from "#models/shipping-method"
import { OrderTransaction } from "#models/transaction"

import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import { default as schema } from "#schema/index"

export const joinerConfig = defineJoinerConfig(Modules.ORDER, {
  schema,
  linkableKeys: {
    claim_id: "OrderClaim",
    exchange_id: "OrderExchange",
  },
  models: [
    Order,
    OrderAddress,
    OrderChange,
    OrderClaim,
    OrderExchange,
    OrderItem,
    OrderLineItem,
    OrderShippingMethod,
    OrderTransaction,
    Return,
    ReturnReason,
  ],
})
