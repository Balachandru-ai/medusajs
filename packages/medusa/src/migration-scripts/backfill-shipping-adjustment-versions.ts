import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Data migration to backfill version field for existing order_shipping_method_adjustment records.
 * Sets adjustment versions based on the latest order_shipping version for their associated shipping method.
 */
export default async function backfillShippingAdjustmentVersions({
  container,
}: ExecArgs) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Backfilling shipping method adjustment versions")

  try {
    await knex.transaction(async (trx) => {
      const result = await trx.raw(`
        WITH latest_order_shipping_version AS (
          SELECT
            os.shipping_method_id AS shipping_method_id,
            MAX(os.version) AS version
          FROM "order_shipping" os
          WHERE os.deleted_at IS NULL
          GROUP BY os.shipping_method_id
        )
        UPDATE "order_shipping_method_adjustment" osma
        SET version = losv.version
        FROM latest_order_shipping_version losv
        WHERE osma.shipping_method_id = losv.shipping_method_id
          AND osma.version <> losv.version
      `)

      logger.info(
        `Successfully backfilled shipping method adjustment versions (${result.rowCount} rows updated)`
      )
    })
  } catch (e) {
    logger.error("Failed to backfill shipping method adjustment versions", e)
    throw e
  }
}
