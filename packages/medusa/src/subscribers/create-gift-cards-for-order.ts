import { createGiftCardsWorkflowId } from "@medusajs/core-flows"
import {
  ContainerRegistrationKeys,
  Modules,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils"
import { SubscriberArgs, SubscriberConfig } from "../types/subscribers"

export default async function createGiftCardsHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    filters: { id: orderId },
    fields: [
      "id",
      "currency_code",
      "items.id",
      "items.subtotal",
      "items.quantity",
      "items.product.is_giftcard",
      "items.*",
      "total",
      "subtotal",
      "tax_total",
    ],
  })

  const giftCardLineItems = order.items.filter(
    (item: any) => !!item.product?.is_giftcard
  )

  if (giftCardLineItems.length === 0) {
    return
  }

  const wfEngine = container.resolve(Modules.WORKFLOW_ENGINE)

  for (const giftCardLineItem of giftCardLineItems) {
    // For each gift card line item quantity, create a gift card using for const giftCard of giftCardLineItem.quantity
    for (let i = 0; i < giftCardLineItem.quantity; i++) {
      const giftCardValue =
        giftCardLineItem.subtotal / giftCardLineItem.quantity

      await wfEngine.run(createGiftCardsWorkflowId, {
        input: [
          {
            value: giftCardValue,
            currency_code: order.currency_code,
            line_item_id: giftCardLineItem.id,
            reference: "order",
            reference_id: order.id,
            metadata: {},
          },
        ],
      })
    }
  }
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.PLACED,
  context: {
    subscriberId: "create-gift-cards-for-order",
  },
}
