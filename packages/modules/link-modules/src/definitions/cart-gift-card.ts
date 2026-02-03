import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { LINKS, Modules } from "@medusajs/framework/utils"

export const CartGiftCard: ModuleJoinerConfig = {
  serviceName: LINKS.CartGiftCard,
  isLink: true,
  databaseConfig: {
    tableName: "cart_gift_card",
    idPrefix: "cartgc",
  },
  alias: [
    {
      name: ["cart_gift_card", "cart_gift_cards"],
      entity: "LinkCartGiftCard",
    },
  ],
  primaryKeys: ["id", "cart_id", "gift_card_id"],
  relationships: [
    {
      serviceName: Modules.CART,
      entity: "Cart",
      primaryKey: "id",
      foreignKey: "cart_id",
      alias: "cart",
      args: {
        methodSuffix: "Carts",
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
      serviceName: Modules.CART,
      entity: "Cart",
      fieldAlias: {
        gift_cards: {
          path: "gift_cards_link.gift_card",
          isList: true,
        },
      },
      relationship: {
        serviceName: LINKS.CartGiftCard,
        primaryKey: "cart_id",
        foreignKey: "id",
        alias: "gift_cards_link",
        isList: true,
      },
    },
    {
      serviceName: Modules.LOYALTY,
      entity: "GiftCard",
      fieldAlias: {
        carts: {
          path: "carts_link.cart",
          isList: true,
        },
      },
      relationship: {
        serviceName: LINKS.CartGiftCard,
        primaryKey: "gift_card_id",
        foreignKey: "id",
        alias: "carts_link",
        isList: true,
      },
    },
  ],
}
