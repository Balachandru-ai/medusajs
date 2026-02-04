import { Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createLinksWorkflow, useQueryGraphStep } from "../../common"

/*
  A workflow that clones gift cards from a cart to an order
*/
export const cloneCartGiftCardsToOrderWorkflowId =
  "clone-cart-gift-cards-to-order"
export const cloneCartGiftCardsToOrderWorkflow = createWorkflow(
  cloneCartGiftCardsToOrderWorkflowId,
  function (input: { order_id: string; cart_id: string }) {
    const { data: order } = useQueryGraphStep({
      entity: "order",
      filters: { id: input.order_id },
      fields: [
        "id",
        "currency_code",
        "total",
        "gift_cards.code",
        "customer_id",
      ],
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-order-query" })

    const { data: cart } = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: ["id", "currency_code", "total", "gift_cards.id", "customer_id"],
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-cart-query" })

    const giftCardIds = transform({ cart }, ({ cart }) => {
      return cart.gift_cards.map((giftCard) => giftCard.id)
    })

    const { data: giftCards } = useQueryGraphStep({
      entity: "gift_card",
      filters: { id: giftCardIds },
      fields: ["id", "code", "status", "customer_id", "currency_code"],
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-gift-card-query" })

    const linksToCreate = transform(
      { giftCards, order },
      ({ giftCards, order }) => {
        const links = giftCards.map((giftCard) => ({
          [Modules.ORDER]: { order_id: order.id },
          [Modules.LOYALTY]: { gift_card_id: giftCard.id },
        }))

        return links
      }
    )

    createLinksWorkflow.runAsStep({ input: linksToCreate })

    return new WorkflowResponse(null)
  }
)
