import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const GiftCardOrderLineItem: ModuleJoinerConfig = {
  isLink: true,
  isReadOnlyLink: true,
  extends: [
    {
      serviceName: Modules.LOYALTY,
      entity: "GiftCard",
      relationship: {
        serviceName: Modules.ORDER,
        entity: "OrderLineItem",
        primaryKey: "id",
        foreignKey: "line_item_id",
        alias: "line_item",
        args: {
          methodSuffix: "OrderLineItems",
        },
      },
    },
    {
      serviceName: Modules.ORDER,
      entity: "OrderLineItem",
      relationship: {
        serviceName: Modules.LOYALTY,
        entity: "GiftCard",
        primaryKey: "line_item_id",
        foreignKey: "id",
        alias: "gift_cards",
        args: {
          methodSuffix: "GiftCards",
        },
        isList: true,
      },
    },
  ],
}
