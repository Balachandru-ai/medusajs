import { LoyaltyTypes } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createGiftCardsStep } from "../steps/create-gift-cards"
import { createStoreCreditAccountsStep } from "../steps/create-store-credit-accounts"
import { creditAccountsWorkflow } from "./credit-accounts"
import { updateGiftCardsWorkflow } from "./update-gift-cards"

/*
  A workflow that creates gift cards
*/
export const createGiftCardsWorkflowId = "create-gift-cards"
export const createGiftCardsWorkflow = createWorkflow(
  createGiftCardsWorkflowId,
  function (input: LoyaltyTypes.CreateGiftCardDTO[]) {
    const giftCards = createGiftCardsStep(input)

    /**
     * Create anonymous credit accounts for the gift cards and link them
     */

    const storeCreditAccountCurrencies = transform(
      { giftCards },
      ({ giftCards }) => {
        return giftCards.map((giftCard) => ({
          currency_code: giftCard.currency_code,
        }))
      }
    )

    const createdStoreCreditAccounts = createStoreCreditAccountsStep(
      storeCreditAccountCurrencies
    )

    /**
     * Credit the accounts with the GC value
     */

    const creditAccountsInput = transform(
      { giftCards, createdStoreCreditAccounts },
      ({ giftCards, createdStoreCreditAccounts }) => {
        return giftCards.map((giftCard, index) => ({
          account_id: createdStoreCreditAccounts[index].id,
          amount: giftCard.value,
          note: "Gift card redemption",
          reference: "gift_card",
          reference_id: giftCard.id,
        }))
      }
    )

    creditAccountsWorkflow.runAsStep({
      input: creditAccountsInput,
    })

    /**
     * Link gift cards to store credit accounts and mark as redeemed
     */

    const updateGiftCardsInput = transform(
      { giftCards, createdStoreCreditAccounts },
      ({ giftCards, createdStoreCreditAccounts }) => {
        return giftCards.map((giftCard, index) => ({
          id: giftCard.id,
          status: LoyaltyTypes.GiftCardStatus.REDEEMED,
          store_credit_account_id: createdStoreCreditAccounts[index].id,
        }))
      }
    )

    updateGiftCardsWorkflow.runAsStep({
      input: updateGiftCardsInput,
    })

    return new WorkflowResponse(giftCards)
  }
)
