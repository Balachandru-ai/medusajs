import AccountHolder from "#models/account-holder"
import Capture from "#models/capture"
import PaymentCollection from "#models/payment-collection"
import PaymentProvider from "#models/payment-provider"
import PaymentSession from "#models/payment-session"
import Payment from "#models/payment"
import RefundReason from "#models/refund-reason"
import Refund from "#models/refund"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.PAYMENT, {
  entities: [
    AccountHolder,
    Capture,
    PaymentCollection,
    PaymentProvider,
    PaymentSession,
    Payment,
    RefundReason,
    Refund,
  ],
})
