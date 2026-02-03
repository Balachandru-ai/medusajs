import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { LINKS, Modules } from "@medusajs/framework/utils"

export const OrderGiftCard: ModuleJoinerConfig = {
  serviceName: LINKS.OrderGiftCard,
  isLink: true,
  databaseConfig: {
    tableName: "order_gift_card",
    idPrefix: "ordergc",
  },
  alias: [
    {
      name: ["order_gift_card", "order_gift_cards"],
      entity: "LinkOrderGiftCard",
    },
  ],
  primaryKeys: ["id", "order_id", "gift_card_id"],
  relationships: [
    {
      serviceName: Modules.ORDER,
      entity: "Order",
      primaryKey: "id",
      foreignKey: "order_id",
      alias: "order",
      args: {
        methodSuffix: "Orders",
      },
      hasMany: true,
    },
    {
      serviceName: Modules.LOYALTY,
      entity: "GiftCard",
      primaryKey: "id",
      foreignKey: "gift_card_id",
      alias: "gift_card",
      args: {
        methodSuffix: "GiftCards",
      },
      hasMany: true,
    },
  ],
  extends: [
    {
      serviceName: Modules.ORDER,
      entity: "Order",
      fieldAlias: {
        gift_cards: {
          path: "gift_cards_link.gift_card",
          isList: true,
        },
      },
      relationship: {
        serviceName: LINKS.OrderGiftCard,
        primaryKey: "order_id",
        foreignKey: "id",
        alias: "gift_cards_link",
        isList: true,
      },
    },
    {
      serviceName: Modules.LOYALTY,
      entity: "GiftCard",
      fieldAlias: {
        orders: {
          path: "orders_link.order",
          isList: true,
        },
      },
      relationship: {
        serviceName: LINKS.OrderGiftCard,
        primaryKey: "gift_card_id",
        foreignKey: "id",
        alias: "orders_link",
        isList: true,
      },
    },
  ],
}
