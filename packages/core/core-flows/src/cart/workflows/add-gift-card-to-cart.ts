import {
  CartTypes,
  CreateCartCreditLineDTO,
  LoyaltyTypes,
} from "@medusajs/framework/types"
import { MathBN, MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createCartCreditLinesWorkflow } from "./create-cart-credit-lines"
import { refreshCartItemsWorkflow } from "./refresh-cart-items"
import { createLinksWorkflow, useQueryGraphStep } from "../../common"
import { validateGiftCardBalancesStep } from "../steps/validate-gift-card-balances"

export const retrieveGiftCardBalanceStepId = "retrieve-gift-cards-balance"
export const retrieveGiftCardBalanceStep = createStep(
  retrieveGiftCardBalanceStepId,
  async function (
    {
      storeCreditAccount,
      giftCard,
    }: {
      storeCreditAccount: LoyaltyTypes.StoreCreditAccountDTO
      giftCard: LoyaltyTypes.GiftCardDTO
    },
    { container }
  ) {
    const accountBalanceMap: Record<string, LoyaltyTypes.AccountStatsDTO> = {}
    const module = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    const giftCardBalance = await module.retrieveAccountStats({
      account_id: storeCreditAccount.id,
    })

    accountBalanceMap[giftCard.code] = giftCardBalance

    return new StepResponse(accountBalanceMap)
  }
)

/**
 * Validate if the gift card exists.
 */
export const validateGiftCardStepId = "validate-gift-card"
const validateGiftCardStep = createStep(
  validateGiftCardStepId,
  async function ({
    giftCard,
    input,
  }: {
    giftCard: LoyaltyTypes.GiftCardDTO
    input: { code: string }
  }) {
    if (!giftCard) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gift card (${input.code}) not found`
      )
    }
  }
)

/**
 * Validate if the gift card can be added to the cart
 */
export const validateCartGiftCardStepId = "validate-cart-gift-card"
export const validateCartGiftCardStep = createStep(
  validateCartGiftCardStepId,
  async function ({
    cart,
    giftCards,
  }: {
    cart: CartTypes.CartDTO
    giftCards: LoyaltyTypes.GiftCardDTO[]
  }) {
    for (const giftCard of giftCards) {
      const cartGiftCard = cart.gift_cards?.find((gc) =>
        gc.code.includes(giftCard.code)
      )

      if (cartGiftCard) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Gift card (${giftCard.code}) already applied to cart`
        )
      }

      if (giftCard.currency_code !== cart.currency_code) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Gift card (${giftCard.code}) currency does not match cart currency`
        )
      }
    }
  }
)

/*
  A workflow that adds gift card to a cart
*/
export const addGiftCardToCartWorkflowId = "add-gift-card-to-cart"
export const addGiftCardToCartWorkflow = createWorkflow(
  addGiftCardToCartWorkflowId,
  function (input: { code: string; cart_id: string }) {
    const { data: cart } = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: [
        "id",
        "currency_code",
        "total",
        "gift_cards.code",
        "gift_cards.store_credit_account.id",
        "gift_cards.store_credit_account.balance",
      ],
      options: { isList: false },
    }).config({ name: "get-cart-query" })

    const { data: giftCards } = useQueryGraphStep({
      entity: "gift_card",
      filters: { code: input.code },
      fields: ["id", "code", "status", "currency_code"],
    }).config({ name: "get-gift-card-query" })

    const giftCard = transform({ giftCards }, ({ giftCards }) => {
      return giftCards[0]
    })

    validateGiftCardStep({ giftCard, input })
    validateCartGiftCardStep({ cart, giftCards })

    const storeCreditAccount = transform({ giftCard }, ({ giftCard }) => {
      return giftCard.store_credit_account
    })

    const giftCardsBalanceMap = retrieveGiftCardBalanceStep({
      storeCreditAccount,
      giftCard,
    })

    validateGiftCardBalancesStep({
      giftCards,
      giftCardsBalanceMap,
    })

    const creditLinesToCreate = transform(
      { giftCardsBalanceMap, giftCards, cart },
      ({ giftCardsBalanceMap, giftCards, cart }) => {
        const creditLinesData: CreateCartCreditLineDTO[] = []

        for (const giftCard of giftCards) {
          const stats = giftCardsBalanceMap[giftCard.code]
          const amount = MathBN.min(stats.balance, cart.total)

          if (amount.gt(0)) {
            creditLinesData.push({
              cart_id: cart.id,
              amount: amount.toNumber(),
              reference: "gift-card",
              reference_id: giftCard.id,
              metadata: {},
            })
          }
        }

        return creditLinesData
      }
    )

    const creditLines = createCartCreditLinesWorkflow.runAsStep({
      input: creditLinesToCreate,
    })

    const linksToCreate = transform(
      { creditLines, cart },
      ({ creditLines, cart }) => {
        const links = creditLines
          .filter((creditLine) => creditLine.reference === "gift-card")
          .map((creditLine) => ({
            [Modules.CART]: { cart_id: cart.id },
            [Modules.LOYALTY]: { gift_card_id: creditLine.reference_id },
          }))

        return links
      }
    )

    createLinksWorkflow.runAsStep({ input: linksToCreate })

    refreshCartItemsWorkflow.runAsStep({
      input: { cart_id: input.cart_id },
    })

    return new WorkflowResponse(creditLines)
  }
)
