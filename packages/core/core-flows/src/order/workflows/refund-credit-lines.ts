import {
  CustomerTypes,
  LoyaltyTypes,
  OrderTypes,
} from "@medusajs/framework/types"
import { MathBN, MedusaError, Modules } from "@medusajs/framework/utils"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  when,
} from "@medusajs/workflows-sdk"
import { creditAccountsWorkflow } from "../../loyalty/workflows"

const validateCustomerStepId = "validate-customer"
const validateCustomerStep = createStep(
  validateCustomerStepId,
  async function ({
    customer,
    negativeCreditLines,
  }: {
    customer: CustomerTypes.CustomerDTO
    negativeCreditLines: OrderTypes.OrderCreditLineDTO[]
  }) {
    // throw only if the customer is a guest and negative credit lines which would result in crediting a store account
    if (!customer.has_account && negativeCreditLines.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Store credit refunds can only be issued to registered customers"
      )
    }

    return new StepResponse(void 0)
  }
)

export const creditAccountTransactionsStepId = "credit-account-transactions"
export const creditAccountTransactionsStep = createStep(
  creditAccountTransactionsStepId,
  async function (
    {
      storeCreditAccount,
      order,
      creditLines,
    }: {
      order: OrderTypes.OrderDTO
      storeCreditAccount: LoyaltyTypes.StoreCreditAccountDTO
      creditLines: OrderTypes.OrderCreditLineDTO[]
    },
    { container }
  ) {
    const module = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    const negativeCreditLines = creditLines.filter((creditLine) =>
      MathBN.convert(creditLine.amount).lt(0)
    )

    let totalCreditAmount = negativeCreditLines.reduce(
      (acc, creditLine) =>
        MathBN.add(acc, MathBN.convert(creditLine.amount).multipliedBy(-1)),
      MathBN.convert(0)
    )

    if (!storeCreditAccount) {
      storeCreditAccount = await module.createStoreCreditAccounts({
        customer_id: order.customer_id,
        currency_code: order.currency_code,
      })
    }

    const creditTransaction = {
      account_id: storeCreditAccount.id,
      amount: totalCreditAmount,
      reference: "order",
      reference_id: order.id,
      note: "Store credit refund",
    }

    return new StepResponse([creditTransaction])
  }
)

/*
    A workflow that credits a store credit account
  */
export const refundCreditLinesWorkflowId = "refund-credit-lines"
export const refundCreditLinesWorkflow = createWorkflow(
  refundCreditLinesWorkflowId,
  function (input: {
    order_id: string
    credit_lines: OrderTypes.OrderCreditLineDTO[]
  }) {
    const { data: order } = useQueryGraphStep({
      entity: "order",
      filters: { id: input.order_id },
      fields: ["id", "customer.*", "customer_id", "currency_code"],
      options: { isList: false },
    }).config({ name: "get-order-query" })

    const { data: customer } = useQueryGraphStep({
      entity: "customer",
      filters: { id: order.customer_id },
      fields: ["id", "email", "has_account"],
      options: {
        throwIfKeyNotFound: true,
        isList: false,
      },
    }).config({ name: "get-customer-query" })

    const negativeCreditLines = transform({ input }, ({ input }) => {
      return (input.credit_lines ?? []).filter((creditLine) =>
        MathBN.convert(creditLine.amount).lt(0)
      )
    })

    validateCustomerStep({ customer, negativeCreditLines })

    const storeCreditAccountsQuery = useQueryGraphStep({
      entity: "store_credit_account",
      filters: {
        customer_id: customer.id,
        currency_code: order.currency_code,
      },
      fields: ["id", "customer_id", "balance", "credits", "debits"],
      options: { isList: false },
    }).config({ name: "get-store-credit-accounts-query" })

    const { data: storeCreditAccount } = storeCreditAccountsQuery

    when({ negativeCreditLines }, ({ negativeCreditLines }) => {
      return negativeCreditLines.length > 0
    }).then(() => {
      const creditTransactions = creditAccountTransactionsStep({
        order,
        storeCreditAccount,
        creditLines: negativeCreditLines,
      })

      creditAccountsWorkflow.runAsStep({
        input: creditTransactions,
      })
    })
  }
)
