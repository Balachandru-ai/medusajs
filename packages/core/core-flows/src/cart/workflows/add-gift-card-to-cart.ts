import { CreateCartCreditLineDTO, LoyaltyTypes } from "@medusajs/framework/types"
import { MathBN, MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createCartCreditLinesWorkflow } from "./create-cart-credit-lines"
import { refreshCartItemsWorkflow } from "./refresh-cart-items"
import { createLinksWorkflow, useQueryGraphStep } from "../../common"

const validateGiftCardStepId = "validate-gift-card"

/**
 * Validates that the gift card exists.
 */
const validateGiftCardStep = createStep(
  validateGiftCardStepId,
  async ({
    giftCard,
    code,
  }: {
    giftCard: LoyaltyTypes.GiftCardDTO | null
    code: string
  }): Promise<StepResponse<void>> => {
    if (!giftCard) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gift card (${code}) not found`
      )
    }

    if (giftCard.status !== "active") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gift card (${code}) is not active`
      )
    }

    return new StepResponse(void 0)
  }
)

const validateCartGiftCardStepId = "validate-cart-gift-card"

/**
 * Validates that the gift card can be added to the cart.
 */
const validateCartGiftCardStep = createStep(
  validateCartGiftCardStepId,
  async ({
    cart,
    giftCard,
  }: {
    cart: { id: string; currency_code: string; gift_cards?: { code: string }[] }
    giftCard: LoyaltyTypes.GiftCardDTO
  }): Promise<StepResponse<void>> => {
    const existingGiftCard = cart.gift_cards?.find((gc) =>
      gc.code.includes(giftCard.code)
    )

    if (existingGiftCard) {
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

    return new StepResponse(void 0)
  }
)

const validateGiftCardBalanceStepId = "validate-gift-card-balance"

/**
 * Validates that the gift card has sufficient balance.
 */
const validateGiftCardBalanceStep = createStep(
  validateGiftCardBalanceStepId,
  async ({
    giftCard,
    balance,
  }: {
    giftCard: LoyaltyTypes.GiftCardDTO
    balance: number
  }): Promise<StepResponse<void>> => {
    if (MathBN.convert(balance).lte(0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gift card (${giftCard.code}) has no balance`
      )
    }

    return new StepResponse(void 0)
  }
)

const retrieveGiftCardBalanceStepId = "retrieve-gift-card-balance"

/**
 * Retrieves the balance for a gift card.
 */
const retrieveGiftCardBalanceStep = createStep(
  retrieveGiftCardBalanceStepId,
  async (
    { giftCardId }: { giftCardId: string },
    { container }
  ): Promise<StepResponse<number>> => {
    const loyaltyModule = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    const giftCard = await loyaltyModule.retrieveGiftCard(giftCardId)
    // For now, use the gift card value as balance
    // In future iterations, this could track remaining balance through transactions
    const balance = Number(giftCard.balance ?? giftCard.value)

    return new StepResponse(balance)
  }
)

export const addGiftCardToCartWorkflowId = "add-gift-card-to-cart"

/**
 * This workflow adds a gift card to a cart.
 */
export const addGiftCardToCartWorkflow = createWorkflow(
  addGiftCardToCartWorkflowId,
  (
    input: WorkflowData<{ code: string; cart_id: string }>
  ): WorkflowResponse<any> => {
    const cartQuery = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: ["id", "currency_code", "total", "gift_cards.code"],
    }).config({ name: "get-cart-query" })

    const cart = transform({ cartQuery }, ({ cartQuery }) => {
      return cartQuery.data[0]
    })

    const giftCardQuery = useQueryGraphStep({
      entity: "gift_card",
      filters: { code: input.code },
      fields: ["id", "code", "status", "currency_code", "value", "balance"],
    }).config({ name: "get-gift-card-query" })

    const giftCard = transform({ giftCardQuery }, ({ giftCardQuery }) => {
      return giftCardQuery.data[0]
    })

    validateGiftCardStep({ giftCard, code: input.code })
    validateCartGiftCardStep({ cart, giftCard })

    const balance = retrieveGiftCardBalanceStep({ giftCardId: giftCard.id })

    validateGiftCardBalanceStep({ giftCard, balance })

    const creditLinesToCreate = transform(
      { giftCard, cart, balance },
      ({ giftCard, cart, balance }) => {
        const amount = MathBN.min(balance, cart.total)

        if (MathBN.convert(amount).lte(0)) {
          return []
        }

        const creditLines: CreateCartCreditLineDTO[] = [
          {
            cart_id: cart.id,
            amount: Number(amount),
            reference: "gift-card",
            reference_id: giftCard.id,
            metadata: {},
          },
        ]

        return creditLines
      }
    )

    const creditLines = createCartCreditLinesWorkflow.runAsStep({
      input: creditLinesToCreate,
    })

    const linksToCreate = transform(
      { giftCard, cart },
      ({ giftCard, cart }) => {
        return [
          {
            [Modules.CART]: { cart_id: cart.id },
            [Modules.LOYALTY]: { gift_card_id: giftCard.id },
          },
        ]
      }
    )

    createLinksWorkflow.runAsStep({ input: linksToCreate })

    refreshCartItemsWorkflow.runAsStep({
      input: { cart_id: input.cart_id },
    })

    return new WorkflowResponse(creditLines)
  }
)
