import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import {
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
} from "@models"
import { default as schema } from "./schema"

export const joinerConfig = defineJoinerConfig(Modules.ORDER, {
  schema,
  linkableKeys: {
    claim_id: "OrderClaim",
    exchange_id: "OrderExchange",
  },
  alias: [
    {
      name: ["shipping_address", "shipping_addresses"],
      entity: "OrderAddress",
      args: {
        methodSuffix: "OrderAddresses",
      },
    },
    {
      name: ["billing_address", "billing_addresses"],
      entity: "OrderAddress",
      args: {
        methodSuffix: "OrderAddresses",
      },
    },
  ],
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
