import { LoyaltyTypes } from "@medusajs/framework/types"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { debitAccountStep } from "../steps/debit-accounts"

/*
  A workflow that debits from a store credit account
*/
export const debitAccountsWorkflowId = "debit-accounts"
export const debitAccountsWorkflow = createWorkflow(
  debitAccountsWorkflowId,
  function (input: LoyaltyTypes.DebitAccountDTO[]) {
    return new WorkflowResponse(debitAccountStep(input))
  }
)
