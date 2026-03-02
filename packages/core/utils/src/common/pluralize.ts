import pluralizeEN from "pluralize"
import { UNCOUNTABLE_WORDS } from "@medusajs/types"
import { upperCaseFirst } from "./upper-case-first"

/**
 * Configure pluralize library with uncountable rules from shared source of truth
 * both for exact words and compound words ending with uncountable words.
 *
 * The regex ensures that:
 * 1. The word is exactly the uncountable word (case-insensitive), OR
 * 2. The word is a compound word where the uncountable word appears at the end with proper word boundaries:
 *    - camelCase: preceded by a lowercase letter (indicating word boundary, e.g., "WildRice", "softDeleteRice")
 *    - snake_case: preceded by an underscore (e.g., "wild_rice", "country_company_info")
 *
 * This prevents false matches like "price" matching "rice" or "softDeletePrice" matching "rice".
 */
UNCOUNTABLE_WORDS.forEach((word) => {
  // Match exact word (case-insensitive)
  pluralizeEN.addUncountableRule(new RegExp(`^${word}$`, "i"))

  // - Ending with uncountable word preceded by lowercase letter (word boundary for camelCase)
  //   e.g., "WildRice", "softDeleteRice" (but NOT "softDeletePrice")
  const capitalizedWord = upperCaseFirst(word)
  pluralizeEN.addUncountableRule(new RegExp(`.*[a-z]${capitalizedWord}$`))

  // Ending with uncountable word preceded by underscore (word boundary for snake_case)
  // e.g., "wild_rice", "country_company_info"
  pluralizeEN.addUncountableRule(new RegExp(`.*_${word}$`, "i"))
})

/**
 * Function to pluralize English words.
 */
export function pluralize(word: string): string {
  // TODO: Implement language specific pluralize function
  return pluralizeEN(word)
}
