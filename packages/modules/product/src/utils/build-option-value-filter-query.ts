import { Context } from "@medusajs/framework/types"
import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"

/**
 * Builds a query to find product IDs that have variants matching
 * at least one option value from each option group.
 *
 * @param optionValueIds - Array of option value IDs to filter by
 * @param sharedContext - Shared Medusa context
 * @returns Array of product IDs that match the criteria
 */
export async function buildOptionValueFilterQuery(
  optionValueIds: string[],
  sharedContext?: Context
): Promise<string[]> {
  if (!optionValueIds || optionValueIds.length === 0) {
    return []
  }

  const manager = (sharedContext?.transactionManager ??
    sharedContext?.manager) as SqlEntityManager

  const knex = manager.getKnex()

  const optionGroups = await knex
    .select("option_id")
    .select(knex.raw("array_agg(id) as option_value_ids"))
    .from("product_option_value")
    .whereIn("id", optionValueIds)
    .whereNotNull("option_id")
    .whereNull("deleted_at")
    .groupBy("option_id")

  if (optionGroups.length === 0) {
    return []
  }

  const optionIds = optionGroups.map(
    (row: { option_id: string }) => row.option_id
  )
  const allValueIds = optionGroups
    .map((row: { option_value_ids: string[] }) => row.option_value_ids)
    .flat()

  const matchingVariants = await knex
    .select("pv.id as variant_id", "pv.product_id")
    .from("product_variant as pv")
    .innerJoin("product_variant_option as pvo", "pv.id", "pvo.variant_id")
    .innerJoin("product_option_value as pov", "pvo.option_value_id", "pov.id")
    .whereIn("pvo.option_value_id", allValueIds)
    .whereIn("pov.option_id", optionIds)
    .whereNull("pv.deleted_at")
    .whereNull("pov.deleted_at")
    .groupBy("pv.id", "pv.product_id")
    .havingRaw(`COUNT(DISTINCT pov.option_id) = ?`, [optionIds.length])

  const productIds = [
    ...new Set(
      matchingVariants.map((row: { product_id: string }) => row.product_id)
    ),
  ]

  return productIds
}
