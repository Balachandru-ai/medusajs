import {
  ComputeActionContext,
  ComputeActionItemLine,
  ComputeActionShippingLine,
  DAL,
  PromotionTypes,
} from "@medusajs/framework/types"
import { flattenObjectToKeyValuePairs } from "@medusajs/framework/utils"
import { raw } from "@mikro-orm/postgresql"

/**
 * Builds a query filter for promotion rules based on the context.
 * This is used to prefilter promotions before computing actions.
 * The idea is that we first retrieve from the database the promotions where all rules can be
 * satisfied by the given context. In other words, down there we actually check the promotion that
 * are not satisfiable by the context and take all the other ones
 *
 * @param context
 * @returns
 */
export function buildPromotionRuleQueryFilterFromContext(
  context: PromotionTypes.ComputeActionContext
): DAL.FilterQuery<any> | null {
  const {
    items = [],
    shipping_methods: shippingMethods = [],
    ...restContext
  } = context

  let flattenItemsPropsValuesArray = flattenObjectToKeyValuePairs(
    items
  ) as Record<keyof ComputeActionItemLine & string, any>
  flattenItemsPropsValuesArray = Object.fromEntries(
    Object.entries(flattenItemsPropsValuesArray).map(([k, v]) => [
      `items.${k}`,
      v,
    ])
  )

  let flattenShippingMethodsPropsValuesArray = flattenObjectToKeyValuePairs(
    shippingMethods
  ) as Record<keyof ComputeActionShippingLine & string, any>
  flattenShippingMethodsPropsValuesArray = Object.fromEntries(
    Object.entries(flattenShippingMethodsPropsValuesArray).map(([k, v]) => [
      `shipping_methods.${k}`,
      v,
    ])
  )

  const flattenRestContextPropsValuesArray = flattenObjectToKeyValuePairs(
    restContext
  ) as Record<keyof ComputeActionContext & string, any>

  const attributeValueMap = new Map<string, Set<any>>()

  ;[
    flattenItemsPropsValuesArray,
    flattenShippingMethodsPropsValuesArray,
    flattenRestContextPropsValuesArray,
  ].forEach((flattenedArray) => {
    Object.entries(flattenedArray).forEach(([prop, value]) => {
      if (!attributeValueMap.has(prop)) {
        attributeValueMap.set(prop, new Set())
      }

      const values = Array.isArray(value) ? value : [value]
      values.forEach((v) => attributeValueMap.get(prop)!.add(v))
    })
  })

  // Build conditions for a NOT EXISTS subquery to exclude promotions with unsatisfiable rules
  const sqlConditions: string[] = []

  attributeValueMap.forEach((valueSet, attribute) => {
    const values = Array.from(valueSet)
    const stringValues = values
      .map((v) => `'${v.toString().replace(/'/g, "''")}'`)
      .join(",")

    const numericValues = values
      .map((v) => {
        const num = Number(v)
        return !isNaN(num) ? num : null
      })
      .filter((v) => v !== null) as number[]

    // Escape attribute name to prevent SQL injection
    const escapedAttribute = `'${attribute.replace(/'/g, "''")}'`

    // For 'in' and 'eq' operators - rule is unsatisfiable if NO rule values overlap with context
    // This requires checking that ALL rule values for a given rule are not in context

    if (stringValues.length) {
      sqlConditions.push(
        `(pr.attribute = ${escapedAttribute} AND pr.operator IN ('in', 'eq') AND pr.id NOT IN (
        SELECT DISTINCT prv_inner.promotion_rule_id
        FROM promotion_rule_value prv_inner
        WHERE prv_inner.value IN (${stringValues})
      ))`
      )
    }

    if (numericValues.length) {
      const minValue = Math.min(...numericValues)
      const maxValue = Math.max(...numericValues)

      // For gt - rule is unsatisfiable if rule_value >= context_max_value
      sqlConditions.push(
        `(pr.attribute = ${escapedAttribute} AND pr.operator = 'gt' AND CAST(prv.value AS DECIMAL) >= ${maxValue})`
      )

      // For gte - rule is unsatisfiable if rule_value > context_max_value
      sqlConditions.push(
        `(pr.attribute = ${escapedAttribute} AND pr.operator = 'gte' AND prv.value NOT IN (${stringValues}) AND CAST(prv.value AS DECIMAL) > ${maxValue})`
      )

      // For lt - rule is unsatisfiable if rule_value <= context_min_value
      sqlConditions.push(
        `(pr.attribute = ${escapedAttribute} AND pr.operator = 'lt' AND CAST(prv.value AS DECIMAL) <= ${minValue})`
      )

      // For lte - rule is unsatisfiable if rule_value < context_min_value
      sqlConditions.push(
        `(pr.attribute = ${escapedAttribute} AND pr.operator = 'lte' AND prv.value NOT IN (${stringValues}) AND CAST(prv.value AS DECIMAL) < ${minValue})`
      )
    }
  })

  // If no conditions were generated, return a filter that excludes nothing (all promotions pass)
  if (sqlConditions.length === 0) {
    return null
  }

  const notExistsSubquery = (alias: string) =>
    `
    NOT EXISTS (
      SELECT 1 FROM promotion_promotion_rule ppr
      JOIN promotion_rule pr ON ppr.promotion_rule_id = pr.id
      JOIN promotion_rule_value prv ON prv.promotion_rule_id = pr.id
      WHERE ppr.promotion_id = ${alias}.id
      AND (${sqlConditions.join(" OR ")})
    )
  `.trim()

  return {
    [raw((alias) => notExistsSubquery(alias))]: true,
  }
}
