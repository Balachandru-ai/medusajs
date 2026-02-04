import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk";
import { ModuleDebitAccount } from "../../../types/store-credit";
import { debitAccountStep } from "../steps/debit-account";

/*
  A workflow that debits from a store credit account
*/
export const debitAccountsWorkflow = createWorkflow(
  "debit-accounts",
  function (input: ModuleDebitAccount[]) {
    return new WorkflowResponse(debitAccountStep(input));
  }
);
