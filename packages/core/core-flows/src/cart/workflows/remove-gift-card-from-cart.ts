import { CartTypes, LoyaltyTypes } from "@medusajs/framework/types"
import { isPresent, MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { deleteCartCreditLinesWorkflow } from "./delete-cart-credit-lines"
import { refreshCartItemsWorkflow } from "./refresh-cart-items"
import { dismissLinksWorkflow, useQueryGraphStep } from "../../common"

export const validateGiftCardInCartStepId = "validate-gift-card-in-cart"
export const validateGiftCardInCartStep = createStep(
  validateGiftCardInCartStepId,
  async function ({
    cart,
    giftCard,
  }: {
    cart: CartTypes.CartDTO
    giftCard: LoyaltyTypes.GiftCardDTO
  }) {
    const cartGiftCard = cart.gift_cards?.find((gc) =>
      gc.code.includes(giftCard.code)
    )

    if (!isPresent(cartGiftCard)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gift card (${giftCard.code}) not found in cart`
      )
    }
  }
)

export const validateGiftCardForRemovalStepId = "validate-gift-card"
export const validateGiftCardStep = createStep(
  validateGiftCardForRemovalStepId,
  async function ({
    cart,
    giftCard,
    input,
  }: {
    cart: CartTypes.CartDTO
    giftCard: LoyaltyTypes.GiftCardDTO
    input: { code: string }
  }) {
    const cartGiftCards = cart.gift_cards || []

    if (!cartGiftCards.find((gc) => gc.code === input.code)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gift card (${input.code}) not found in cart`
      )
    }

    if (!giftCard) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gift card (${input.code}) not found`
      )
    }
  }
)

/*
  A workflow that removes gift card from a cart
*/
export const removeGiftCardFromCartWorkflowId = "remove-gift-card-from-cart"
export const removeGiftCardFromCartWorkflow = createWorkflow(
  removeGiftCardFromCartWorkflowId,
  function (input: { code: string; cart_id: string }) {
    const cartQuery = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: [
        "id",
        "credit_lines.id",
        "credit_lines.reference",
        "credit_lines.reference_id",
        "gift_cards.id",
        "gift_cards.code",
      ],
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-cart-query" })

    const cart = cartQuery.data

    const giftCardQuery = useQueryGraphStep({
      entity: "gift_card",
      filters: { code: input.code },
      fields: ["id", "code"],
      options: { isList: false },
    }).config({ name: "get-gift-card-query" })

    const giftCard = giftCardQuery.data

    validateGiftCardStep({ cart, giftCard, input })
    validateGiftCardInCartStep({ cart, giftCard })

    const creditLineIds = transform(
      { cart, giftCard },
      ({ cart, giftCard }) => {
        return cart.credit_lines
          .filter(
            (creditLine) =>
              creditLine.reference === "gift-card" &&
              creditLine.reference_id === giftCard.id
          )
          .map((creditLine) => creditLine.id)
      }
    )

    deleteCartCreditLinesWorkflow.runAsStep({
      input: { id: creditLineIds },
    })

    dismissLinksWorkflow.runAsStep({
      input: [
        {
          [Modules.CART]: { cart_id: cart.id },
          [Modules.LOYALTY]: { gift_card_id: giftCard.id },
        },
      ],
    })

    refreshCartItemsWorkflow.runAsStep({
      input: { cart_id: input.cart_id },
    })
  }
)
