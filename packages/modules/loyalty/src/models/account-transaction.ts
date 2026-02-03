import { model } from "@medusajs/framework/utils"
import { StoreCreditAccount } from "./store-credit-account"
import LoyaltyTypes from "@medusajs/framework/types"

export const AccountTransaction = model.define(
  { tableName: "store_credit_account_transaction", name: "AccountTransaction" },
  {
    id: model.id({ prefix: "sc_trx" }).primaryKey(),
    amount: model.bigNumber(),
    type: model.enum(LoyaltyTypes.TransactionType),
    reference: model.text(),
    reference_id: model.text(),
    note: model.text().nullable(),
    metadata: model.json().nullable(),

    account: model.belongsTo(() => StoreCreditAccount, {
      mappedBy: "transactions",
    }),
  }
)
