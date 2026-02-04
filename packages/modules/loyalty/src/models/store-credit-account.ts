import { model } from "@medusajs/framework/utils"
import { AccountTransaction } from "./account-transaction"
import { GiftCard } from "./gift-card"

export const StoreCreditAccount = model
  .define(
    { tableName: "store_credit_account", name: "StoreCreditAccount" },
    {
      id: model.id({ prefix: "sc_acc" }).primaryKey(),
      code: model.text().nullable(),
      currency_code: model.text().searchable(),
      customer_id: model.text().nullable(),
      metadata: model.json().nullable(),

      transactions: model.hasMany(() => AccountTransaction, {
        mappedBy: "account",
      }),
      gift_cards: model.hasMany(() => GiftCard, {
        mappedBy: "store_credit_account",
      }),
    }
  )
  .indexes([
    {
      name: "IDX_customer_id_currency_code",
      on: ["customer_id", "currency_code"],
      unique: true,
      where: "customer_id IS NOT NULL",
    },
  ])
