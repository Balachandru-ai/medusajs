import { CartTypes } from "@medusajs/framework/types"
import { MathBN, Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createCartCreditLinesWorkflow } from "./create-cart-credit-lines"
import { deleteCartCreditLinesWorkflow } from "./delete-cart-credit-lines"
import {
  createLinksWorkflow,
  dismissLinksWorkflow,
  useQueryGraphStep,
} from "../../common"
import { retrieveGiftCardsBalanceStep } from "../../loyalty"
import { validateGiftCardBalancesStep } from "../steps/validate-gift-card-balances"

/*
  A workflow that refreshes gift card to a cart
*/
export const refreshCartGiftCardsWorkflowId = "refresh-cart-gift-card"
export const refreshCartGiftCardsWorkflow = createWorkflow(
  refreshCartGiftCardsWorkflowId,
  function (input: { cart_id: string }) {
    const { data: existingCart } = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: [
        "id",
        "currency_code",
        "total",
        "gift_cards.code",
        "credit_lines.id",
        "credit_lines.reference",
        "credit_lines.reference_id",
      ],
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-existing-cart-query" })

    const toDismiss = transform({ existingCart }, ({ existingCart }) => {
      const giftCardCreditLines = existingCart.credit_lines.filter(
        (creditLine) => creditLine.reference === "gift-card"
      )

      return {
        creditLineIds: giftCardCreditLines.map((cl) => cl.id),
        giftCardIds: giftCardCreditLines.map((cl) => cl.reference_id),
      }
    })

    deleteCartCreditLinesWorkflow.runAsStep({
      input: {
        id: toDismiss.creditLineIds,
      },
    })

    const linksToDismiss = transform(
      { toDismiss, existingCart },
      ({ toDismiss, existingCart }) => {
        const links = toDismiss.giftCardIds.map((giftCardId) => ({
          [Modules.CART]: { cart_id: existingCart.id },
          [Modules.LOYALTY]: { gift_card_id: giftCardId },
        }))

        return links
      }
    )

    dismissLinksWorkflow.runAsStep({ input: linksToDismiss })

    const giftCardCodes = transform({ existingCart }, ({ existingCart }) => {
      return existingCart.gift_cards.map((gc) => gc.code)
    })

    const { data: giftCards } = useQueryGraphStep({
      entity: "gift_card",
      filters: { code: giftCardCodes },
      fields: [
        "id",
        "code",
        "status",
        "currency_code",
        "store_credit_account.id",
      ],
    }).config({ name: "get-gift-card-query" })

    const { giftCardStoreCreditAccountMap } = transform(
      { giftCards },
      ({ giftCards }) => {
        const giftCardStoreCreditAccountMap: Record<string, string> = {}

        for (const giftCard of giftCards) {
          if (giftCard.store_credit_account) {
            giftCardStoreCreditAccountMap[giftCard.id] =
              giftCard.store_credit_account.id
          }
        }

        return {
          giftCardStoreCreditAccountMap,
        }
      }
    )

    const giftCardsBalanceMap = retrieveGiftCardsBalanceStep({
      giftCards,
      giftCardStoreCreditAccountMap,
    })

    validateGiftCardBalancesStep({
      giftCards,
      giftCardsBalanceMap,
    })

    const { data: cart } = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: [
        "id",
        "currency_code",
        "total",
        "gift_cards.code",
        "customer_id",
      ],
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-cart-query" })

    const creditLinesToCreate = transform(
      { giftCardsBalanceMap, giftCards, cart },
      ({ giftCardsBalanceMap, giftCards, cart }) => {
        let tempCartTotal = MathBN.convert(cart.total)
        const creditLinesData: CartTypes.CreateCartCreditLineDTO[] = []

        for (const giftCard of giftCards) {
          const stats = giftCardsBalanceMap[giftCard.code]
          const amount = MathBN.min(stats.balance, tempCartTotal)

          if (amount.gt(0)) {
            creditLinesData.push({
              cart_id: cart.id,
              amount: amount.toNumber(),
              reference: "gift-card",
              reference_id: giftCard.id,
              metadata: {},
            })

            tempCartTotal = tempCartTotal.minus(amount)
          }
        }

        return creditLinesData
      }
    )

    const creditLines = createCartCreditLinesWorkflow.runAsStep({
      input: creditLinesToCreate,
    })

    const linksToCreate = transform(
      { giftCards, cart },
      ({ giftCards, cart }) => {
        const links = giftCards.map((giftCard) => ({
          [Modules.CART]: { cart_id: cart.id },
          [Modules.LOYALTY]: { gift_card_id: giftCard.id },
        }))

        return links
      }
    )

    createLinksWorkflow.runAsStep({ input: linksToCreate })

    return new WorkflowResponse(creditLines)
  }
)
