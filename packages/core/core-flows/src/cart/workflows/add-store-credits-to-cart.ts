import { CartTypes, LoyaltyTypes } from "@medusajs/framework/types"
import { isDefined, MathBN, MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  parallelize,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createCartCreditLinesWorkflow } from "./create-cart-credit-lines"
import { deleteCartCreditLinesWorkflow } from "./delete-cart-credit-lines"
import { refreshCartItemsWorkflow } from "./refresh-cart-items"
import { useQueryGraphStep } from "../../common"

export const validateCustomerStoreCreditAccountStepId =
  "validate-customer-store-credit-account"
export const validateCustomerStoreCreditAccountStep = createStep(
  validateCustomerStoreCreditAccountStepId,
  async function ({
    storeCreditAccount,
  }: {
    storeCreditAccount: LoyaltyTypes.StoreCreditAccountDTO
  }) {
    if (!storeCreditAccount) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Store credit account not found for the customer on the cart in that currency.`
      )
    }

    if (MathBN.convert(storeCreditAccount.balance).lte(0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Store credit account has no balance`
      )
    }
  }
)

const validateCartStepId = "validate-cart"
const validateCartStep = createStep(
  validateCartStepId,
  async function ({
    cart,
    input,
  }: {
    cart: CartTypes.CartDTO
    input: { cart_id: string }
  }) {
    if (!cart) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Cart with id ${input.cart_id} not found`
      )
    }

    if (!cart.customer_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Cart's customer must be set to add store credits`
      )
    }

    if (!cart.currency_code) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Cart's currency must be set to add store credits`
      )
    }
  }
)

/*
  A workflow that adds store credits to a cart
*/
export const addStoreCreditsToCartWorkflowId = "add-store-credits-to-cart"
export const addStoreCreditsToCartWorkflow = createWorkflow(
  addStoreCreditsToCartWorkflowId,
  function (input: { amount?: number; cart_id: string }) {
    const cartQuery = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: ["id", "currency_code", "total", "customer_id", "credit_lines.*"],
      options: { isList: false },
    }).config({ name: "get-cart-query" })

    const cart = cartQuery.data

    validateCartStep({ cart, input })

    const storeCreditAccountQuery = useQueryGraphStep({
      entity: "store_credit_account",
      filters: {
        customer_id: cart.customer_id,
        currency_code: cart.currency_code,
      },
      fields: ["id", "balance"],
      options: { isList: false },
    }).config({ name: "get-store-credit-account-query" })

    const storeCreditAccount = storeCreditAccountQuery.data

    validateCustomerStoreCreditAccountStep({
      storeCreditAccount,
    })

    const creditLineActions = transform(
      { storeCreditAccount, cart, input },
      ({ storeCreditAccount, cart, input }) => {
        const creditLinesToCreate: CartTypes.CreateCartCreditLineDTO[] = []
        const creditLinesToDelete = (cart.credit_lines ?? [])
          .filter((creditLine) => creditLine.reference === "store-credit")
          .map((creditLine) => creditLine.id)

        let amount = input.amount
          ? MathBN.convert(input.amount)
          : MathBN.convert(storeCreditAccount.balance)

        if (
          isDefined(input.amount) &&
          MathBN.convert(amount).gt(MathBN.convert(storeCreditAccount.balance))
        ) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Amount is greater than the store credit account balance`
          )
        }

        if (amount.gt(0)) {
          creditLinesToCreate.push({
            cart_id: cart.id,
            amount: MathBN.min(amount, cart.total).toNumber(),
            reference: "store-credit",
            reference_id: storeCreditAccount.id,
            metadata: {},
          })
        }

        return {
          creditLinesToCreate,
          creditLinesToDelete,
        }
      }
    )

    const [_deletedCreditLines, createdCreditLines] = parallelize(
      deleteCartCreditLinesWorkflow.runAsStep({
        input: {
          id: creditLineActions.creditLinesToDelete,
        },
      }),
      createCartCreditLinesWorkflow.runAsStep({
        input: creditLineActions.creditLinesToCreate,
      })
    )

    refreshCartItemsWorkflow.runAsStep({
      input: { cart_id: input.cart_id },
    })

    return new WorkflowResponse(createdCreditLines)
  }
)
