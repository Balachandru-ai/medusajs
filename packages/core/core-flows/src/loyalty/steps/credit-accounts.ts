import { LoyaltyTypes } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const creditAccountStepId = "credit-account"
export const creditAccountStep = createStep(
  creditAccountStepId,
  async (input: LoyaltyTypes.CreditAccountDTO[], { container }) => {
    const module = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    const transactions = await module.creditAccounts(input)

    return new StepResponse(
      transactions,
      transactions.map((t) => t.id)
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }

    const module = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    await module.deleteAccountTransactions(ids)
  }
)
