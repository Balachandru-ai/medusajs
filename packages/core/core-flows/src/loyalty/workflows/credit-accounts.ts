import { LoyaltyTypes } from "@medusajs/framework/types"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { creditAccountStep } from "../steps/credit-accounts"

/*
  A workflow that credits to a store credit account
*/
export const creditAccountsWorkflowId = "credit-accounts"
export const creditAccountsWorkflow = createWorkflow(
  creditAccountsWorkflowId,
  function (input: LoyaltyTypes.CreditAccountDTO[]) {
    return new WorkflowResponse(creditAccountStep(input))
  }
)
