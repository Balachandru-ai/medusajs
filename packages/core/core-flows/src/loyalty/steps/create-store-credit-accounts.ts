import { LoyaltyTypes } from "@medusajs/framework/types"
import { generateCode, isPresent, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const createStoreCreditAccountsStepId = "create-store-credit-accounts"
export const createStoreCreditAccountsStep = createStep(
  createStoreCreditAccountsStepId,
  async (input: LoyaltyTypes.CreateStoreCreditAccountDTO[], { container }) => {
    const module = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    for (const account of input) {
      if (!isPresent(account.code)) {
        account.code = generateCode("SC")
      }
    }

    const accounts = await module.createStoreCreditAccounts(input)

    return new StepResponse(
      accounts,
      accounts.map((gc) => gc.id)
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }

    const module = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    await module.deleteStoreCreditAccounts(ids)
  }
)
