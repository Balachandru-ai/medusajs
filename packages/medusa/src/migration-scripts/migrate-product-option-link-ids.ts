import { MedusaModule } from "@medusajs/framework/modules-sdk"
import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  generateEntityId,
} from "@medusajs/framework/utils"

const BATCH_SIZE = 1000

type PgConnection = {
  raw: <T = unknown>(
    query: string,
    bindings?: unknown[]
  ) => Promise<{ rows: T[] }>
}

type UpdateIdsOptions = {
  tableName: string
  idPrefix: string
  pgConnection: PgConnection
}

async function updateIdsInBatches({
  tableName,
  idPrefix,
  pgConnection,
}: UpdateIdsOptions): Promise<number> {
  let updatedCount = 0
  const idPrefixPattern = `${idPrefix}_%`

  const { rows: countRows } = await pgConnection.raw<{ count: string }>(
    `select count(id)::int as count from "${tableName}" where id not like ?`,
    [idPrefixPattern]
  )
  const totalRows = Number(countRows[0]?.count ?? 0)

  if (!totalRows) {
    return 0
  }

  while (updatedCount < totalRows) {
    const { rows } = await pgConnection.raw<{ id: string }>(
      `select id from "${tableName}" where id not like ? order by id limit ?`,
      [idPrefixPattern, BATCH_SIZE]
    )

    if (!rows.length) {
      break
    }

    const idMappings = rows.map((row) => ({
      oldId: row.id,
      newId: generateEntityId(undefined, idPrefix),
    }))

    const valuesClause = idMappings.map(() => "(?, ?)").join(", ")
    const bindings = idMappings.flatMap((entry) => [entry.oldId, entry.newId])

    await pgConnection.raw(
      `update "${tableName}" as t
        set id = v.new_id
        from (values ${valuesClause}) as v(old_id, new_id)
        where t.id = v.old_id`,
      bindings
    )

    updatedCount += idMappings.length
  }

  return updatedCount
}

export default async function migrateProductOptionLinkIds({
  container,
}: ExecArgs) {
  if (!MedusaModule.isInstalled(Modules.PRODUCT)) {
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pgConnection = container.resolve(
    ContainerRegistrationKeys.PG_CONNECTION
  )

  try {
    await pgConnection.transaction(async (trx) => {
      await updateIdsInBatches({
        tableName: "product_product_option",
        idPrefix: "prodopt",
        pgConnection: trx,
      })

      await updateIdsInBatches({
        tableName: "product_product_option_value",
        idPrefix: "prodoptval",
        pgConnection: trx,
      })
    })
  } catch (error) {
    logger.error(error)
    throw error
  }
}
