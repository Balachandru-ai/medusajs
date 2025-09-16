import {
  ComputeActionContext,
  ComputeActionItemLine,
  ComputeActionShippingLine,
  PromotionTypes,
} from "@medusajs/framework/types"
import { flattenObjectToKeyValuePairs } from "@medusajs/framework/utils"
import { raw } from "@mikro-orm/postgresql"

/**
 * Builds a query filter for promotion rules based on the context.
 * This is used to prefilter promotions before computing actions.
 * It is mainly used to prevent loading all the data of all the promotions when computing actions
 * and potentially be smarter in rule querying
 * .
 * @param context
 * @returns
 */
export function buildPromotionRuleQueryFilterFromContext(
  context: PromotionTypes.ComputeActionContext
) {
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

  const rulePrefilteringFilters = Array.from(
    attributeValueMap.entries()
  ).flatMap(([attribute, valueSet]) => {
    const values = Array.from(valueSet)
    const stringValues = values.map((v) => `${v}`)
    const filters: any[] = []

    // For 'in' and 'eq' operators - direct value matching
    filters.push({
      rules: {
        $and: [
          { attribute },
          { operator: { $in: ["in", "eq"] } },
          {
            values: {
              value: { $in: stringValues },
            },
          },
        ],
      },
    })

    // For numeric comparison operators, handle both string and numeric values
    const numericValues = values
      .map((v) => {
        const num = Number(v)
        return !isNaN(num) ? num : null
      })
      .filter((v) => v !== null)

    if (numericValues.length > 0) {
      const minValue = Math.min(...numericValues)
      const maxValue = Math.max(...numericValues)

      // For gt - context values should be greater than rule values
      // This means: CAST(rule_value AS DECIMAL) < context_max_value
      filters.push({
        rules: {
          $and: [
            { attribute },
            { operator: "gt" },
            {
              values: {
                [raw((alias) => `CAST(${alias}.value AS DECIMAL)`)]: {
                  $lt: maxValue,
                },
              },
            },
          ],
        },
      })

      // For gte - context values should be greater than or equal to rule values
      // This means: CAST(rule_value AS DECIMAL) <= context_max_value
      filters.push({
        rules: {
          $and: [
            { attribute },
            { operator: "gte" },
            {
              values: {
                $or: [
                  { value: { $in: stringValues } },
                  {
                    [raw((alias) => `CAST(${alias}.value AS DECIMAL)`)]: {
                      $lte: maxValue,
                    },
                  },
                ],
              },
            },
          ],
        },
      })

      // For lt - context values should be less than rule values
      // This means: CAST(rule_value AS DECIMAL) > context_min_value
      filters.push({
        rules: {
          $and: [
            { attribute },
            { operator: "lt" },
            {
              values: {
                [raw((alias) => `CAST(${alias}.value AS DECIMAL)`)]: {
                  $gt: minValue,
                },
              },
            },
          ],
        },
      })

      // For lte - context values should be less than or equal to rule values
      // This means: CAST(rule_value AS DECIMAL) >= context_min_value
      filters.push({
        rules: {
          $and: [
            { attribute },
            { operator: "lte" },
            {
              values: {
                $or: [
                  { value: { $in: stringValues } },
                  {
                    [raw((alias) => `CAST(${alias}.value AS DECIMAL)`)]: {
                      $gte: minValue,
                    },
                  },
                ],
              },
            },
          ],
        },
      })
    }

    return filters
  })

  return rulePrefilteringFilters
}
