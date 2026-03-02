import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/types"

export default async function migrateNormalizeCurrencyCodes({
  container,
}: ExecArgs) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  await knex.transaction(async (trx) => {
    const tables = [
      "cart",
      "payment_collection",
      "payment_session",
      "payment",
      "order",
      "order_transaction",
      "price",
      "region",
      "store_currency",
    ]

    for (const table of tables) {
      await trx(table)
        .whereNotNull("currency_code")
        .update({
          currency_code: knex.raw("LOWER(currency_code)"),
        })
    }
  })
}
