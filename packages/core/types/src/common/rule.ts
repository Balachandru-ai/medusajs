/**
 * The accepted values for the shipping rule option's operator.
 */
export type RuleOperatorType =
  | "in"
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "nin"

/**
 * The accepted values for the pricing rule option's operator.
 */
export type PricingRuleOperatorType = "eq" | "gt" | "gte" | "lt" | "lte"
