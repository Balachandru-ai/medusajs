import { LoyaltyTypes } from "@medusajs/framework/types"
import { isPresent, MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStoreCreditAccountsStep } from "../steps/create-store-credit-accounts"

export const validateStoreCreditAccountInputStepId = "validate-store-credit-account-input"
export const validateStoreCreditAccountInputStep = createStep(
  validateStoreCreditAccountInputStepId,
  async function (input: LoyaltyTypes.CreateStoreCreditAccountDTO[]) {
    if (input.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No input provided"
      )
    }

    if (input.some((i) => !isPresent(i.currency_code))) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Currency code is required to create a store credit account"
      )
    }
  }
)

type CreateStoreCreditAccountInput = {
  code?: string
  customer_id: string
  currency_code: string
}

/*
  A workflow that creates store credit accounts
*/
export const createStoreCreditAccountsWorkflowId = "create-store-credit-accounts"
export const createStoreCreditAccountsWorkflow = createWorkflow(
  createStoreCreditAccountsWorkflowId,
  function (input: CreateStoreCreditAccountInput[]) {
    validateStoreCreditAccountInputStep(input)

    const createdStoreCreditAccounts = createStoreCreditAccountsStep(input)
    return new WorkflowResponse(createdStoreCreditAccounts)
  }
)
