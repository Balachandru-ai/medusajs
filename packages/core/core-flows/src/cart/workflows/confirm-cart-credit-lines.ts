import { LoyaltyTypes } from "@medusajs/framework/types"
import { MathBN, MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "../../common"
import { debitAccountsWorkflow } from "../../loyalty"

export const validateStoreCreditAccountStepId = "validate-store-credit-account"
export const validateStoreCreditAccountStep = createStep(
  validateStoreCreditAccountStepId,
  async function ({
    giftCards,
    giftCardsBalanceMap,
  }: {
    giftCards: LoyaltyTypes.GiftCardDTO[]
    giftCardsBalanceMap: Record<string, LoyaltyTypes.AccountStatsDTO>
  }) {
    for (const giftCard of giftCards) {
      const stats = giftCardsBalanceMap[giftCard.code]

      if (MathBN.convert(stats.balance).lte(0)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Gift card (${giftCard.code}) has no balance`
        )
      }
    }
  }
)

/*
  A workflow that confirms the credit lines of a cart
*/
export const confirmCartCreditLinesWorkflowId = "confirm-cart-credit-lines"
export const confirmCartCreditLinesWorkflow = createWorkflow(
  confirmCartCreditLinesWorkflowId,
  function (input: { cart_id: string }) {
    const { data: cart } = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: [
        "id",
        "customer_id",
        "currency_code",
        "credit_lines.id",
        "credit_lines.reference",
        "credit_lines.reference_id",
        "credit_lines.amount",
        "gift_cards.code",
        "gift_cards.id",
        "gift_cards.status",
        "gift_cards.currency_code",
        "gift_cards.store_credit_account.id",
      ],
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-existing-cart-query" })

    const storeCreditAccountsMap = transform({ cart }, ({ cart }) => {
      return cart.gift_cards.reduce((acc, curr) => {
        if (curr.store_credit_account) {
          acc[curr.id] = curr.store_credit_account.id
        }
        return acc
      }, {} as Record<string, string>)
    })

    const debitAccountsInput = transform(
      { cart, storeCreditAccountsMap },
      ({ cart, storeCreditAccountsMap }) => {
        return (cart.credit_lines || [])
          .filter(
            (cl) =>
              cl.reference === "store-credit" || cl.reference === "gift-card"
          )
          .map((cl) => {
            const storeCreditAccount = storeCreditAccountsMap[cl.reference_id]

            return {
              account_id: storeCreditAccount || cl.reference_id,
              amount: cl.amount,
              reference: "cart",
              reference_id: cart.id,
              note: "Gift card usage",
            }
          })
      }
    )

    debitAccountsWorkflow.runAsStep({
      input: debitAccountsInput,
    })

    return new WorkflowResponse([])
  }
)
