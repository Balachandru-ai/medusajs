import { LoyaltyTypes } from "@medusajs/framework/types"
import { MathBN, MedusaError } from "@medusajs/framework/utils"
import { createStep } from "@medusajs/framework/workflows-sdk"

export const validateGiftCardBalancesStepId = "validate-gift-card-balances"
export const validateGiftCardBalancesStep = createStep(
  validateGiftCardBalancesStepId,
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
