import { CustomerDTO, LoyaltyTypes } from "@medusajs/framework/types"
import { isPresent, MathBN, MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "../../common"
import { debitAccountStep } from "../steps/debit-accounts"
import { creditAccountStep } from "../steps/credit-accounts"
import { createStoreCreditAccountsStep } from "../steps/create-store-credit-accounts"

type ClaimStoreCreditAccountInput = {
  code: string
  customer_id: string
}

export const validateClaimStoreCreditAccountInputStepId =
  "validate-claim-store-credit-account-input"
export const validateClaimStoreCreditAccountInputStep = createStep(
  validateClaimStoreCreditAccountInputStepId,
  async function (args: {
    input: ClaimStoreCreditAccountInput
    customer: CustomerDTO
  }) {
    const { input, customer } = args

    if (!isPresent(input.code)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Code is required to claim a store credit account"
      )
    }

    if (!input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Customer Id is required to claim a store credit account"
      )
    }

    if (!customer.has_account) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Only customers with an account can claim a store credit account"
      )
    }
  }
)

export const validateSourceStoreCreditAccountsStepId =
  "validate-source-store-credit-account"
const validateSourceStoreCreditAccountsStep = createStep(
  validateSourceStoreCreditAccountsStepId,
  async function (args: {
    sourceStoreCreditAccount: LoyaltyTypes.StoreCreditAccountDTO
    targetStoreCreditAccount: LoyaltyTypes.StoreCreditAccountDTO
  }) {
    const { sourceStoreCreditAccount, targetStoreCreditAccount } = args

    if (sourceStoreCreditAccount.id === targetStoreCreditAccount.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Customer already owns the store credit account"
      )
    }

    if (sourceStoreCreditAccount.customer_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cannot claim a store credit account that belongs to a customer"
      )
    }

    if (MathBN.convert(sourceStoreCreditAccount.balance).lte(0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cannot claim a store credit account with no balance"
      )
    }
  }
)

/*
  A workflow that claims a store credit account for a customer.
  The account with `code` is debited and customer account is credited.
*/
export const claimStoreCreditAccountWorkflowId = "claim-store-credit-account"
export const claimStoreCreditAccountWorkflow = createWorkflow(
  claimStoreCreditAccountWorkflowId,
  function (input: ClaimStoreCreditAccountInput) {
    const { data: sourceStoreCreditAccount } = useQueryGraphStep({
      entity: "store_credit_account",
      fields: ["id", "code", "customer_id", "currency_code", "balance"],
      filters: { code: input.code },
      options: { isList: false },
    }).config({
      name: "source-store-credit-account-data",
    })

    const accountCurrencyCode = transform(
      { sourceStoreCreditAccount },
      ({ sourceStoreCreditAccount }) => {
        return sourceStoreCreditAccount.currency_code
      }
    )

    const { data: customer } = useQueryGraphStep({
      entity: "customer",
      fields: ["id", "email", "has_account"],
      filters: { id: input.customer_id },
      options: { isList: false },
    }).config({
      name: "customer-data",
    })

    validateClaimStoreCreditAccountInputStep({ input, customer })

    const { data: existingCustomerStoreCreditAccount } = useQueryGraphStep({
      entity: "store_credit_account",
      fields: ["id", "code", "customer_id", "currency_code", "balance"],
      filters: {
        customer_id: input.customer_id,
        currency_code: accountCurrencyCode,
      },
      options: { isList: false },
    }).config({
      name: "existing-customer-store-credit-account-data",
    })

    const createdStoreCreditAccount = when(
      "store-account-does-not-exist",
      { existingCustomerStoreCreditAccount },
      ({ existingCustomerStoreCreditAccount }) =>
        !existingCustomerStoreCreditAccount
    ).then(() => {
      return createStoreCreditAccountsStep([
        {
          customer_id: input.customer_id,
          currency_code: sourceStoreCreditAccount.currency_code,
        },
      ])[0]
    })

    const targetStoreCreditAccount = transform(
      {
        existingCustomerStoreCreditAccount,
        createdStoreCreditAccount,
      },
      ({ existingCustomerStoreCreditAccount, createdStoreCreditAccount }) => {
        return existingCustomerStoreCreditAccount || createdStoreCreditAccount
      }
    )

    const balanceToTransfer = transform(
      {
        sourceStoreCreditAccount,
      },
      ({ sourceStoreCreditAccount }) => {
        return MathBN.convert(sourceStoreCreditAccount.balance)
      }
    )

    validateSourceStoreCreditAccountsStep({
      sourceStoreCreditAccount,
      targetStoreCreditAccount,
    })

    debitAccountStep([
      {
        account_id: sourceStoreCreditAccount.id,
        amount: balanceToTransfer,
        reference: "store-credit",
        reference_id: targetStoreCreditAccount.id,
      },
    ])

    creditAccountStep([
      {
        account_id: targetStoreCreditAccount.id,
        amount: balanceToTransfer,
        reference: "store-credit",
        reference_id: sourceStoreCreditAccount.id,
      },
    ])

    return new WorkflowResponse(void 0)
  }
)
