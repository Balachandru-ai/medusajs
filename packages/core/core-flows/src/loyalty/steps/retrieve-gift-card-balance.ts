import { LoyaltyTypes } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const retrieveGiftCardsBalanceStepId = "retrieve-gift-cards-balance"
export const retrieveGiftCardsBalanceStep = createStep(
  retrieveGiftCardsBalanceStepId,
  async function (
    {
      giftCardStoreCreditAccountMap,
      giftCards,
    }: {
      giftCardStoreCreditAccountMap: Record<string, string>
      giftCards: LoyaltyTypes.GiftCardDTO[]
    },
    { container }
  ) {
    const accountBalanceMap: Record<string, LoyaltyTypes.AccountStatsDTO> = {}
    const module = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    for (const giftCard of giftCards) {
      const giftCardBalance = await module.retrieveAccountStats({
        account_id: giftCardStoreCreditAccountMap[giftCard.id],
      })

      accountBalanceMap[giftCard.code] = giftCardBalance
    }

    return new StepResponse(accountBalanceMap)
  }
)
