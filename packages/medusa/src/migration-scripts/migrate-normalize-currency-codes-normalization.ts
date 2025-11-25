import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/types"

export default async function migrateNormalizeCurrencyCodes({
  container,
}: ExecArgs) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  await knex.transaction(async (trx) => {
    return await trx("price").update({
      currency_code: knex.raw("LOWER(currency_code)"),
    })
  })
}
