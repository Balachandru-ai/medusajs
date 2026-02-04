import { LoyaltyTypes } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const debitAccountStepId = "debit-account"
export const debitAccountStep = createStep(
  debitAccountStepId,
  async (input: LoyaltyTypes.DebitAccountDTO[], { container }) => {
    const module = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    const transactions = await module.debitAccounts(input)

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
