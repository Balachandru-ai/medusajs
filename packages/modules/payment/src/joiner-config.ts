import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import AccountHolder from "#models/account-holder"
import Payment from "#models/payment"
import PaymentCollection from "#models/payment-collection"
import PaymentProvider from "#models/payment-provider"
import RefundReason from "#models/refund-reason"

export const joinerConfig = defineJoinerConfig(Modules.PAYMENT, {
  linkableKeys: {
    payment_id: Payment.name,
    payment_collection_id: PaymentCollection.name,
    payment_provider_id: PaymentProvider.name,
    refund_reason_id: RefundReason.name,
    account_holder_id: AccountHolder.name,
  },
  alias: [
    {
      name: ["payment_method", "payment_methods"],
      entity: "PaymentMethod",
      args: {
        methodSuffix: "PaymentMethods",
      },
    },
  ],
})
