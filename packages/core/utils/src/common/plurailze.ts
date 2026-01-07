import pluralizeEN from "pluralize"
import { UNCOUNTABLE_WORDS } from "./uncountable-words"

/**
 * Configure pluralize library with uncountable rules from shared source of truth
 * both for exact words and compound words ending with uncountable words.
 *
 */
UNCOUNTABLE_WORDS.forEach((word) => {
  pluralizeEN.addUncountableRule(new RegExp(`.*${word}$`, "i"))
})

/**
 * Function to pluralize English words.
 */
export function pluralize(word: string): string {
  // TODO: Implement language specific pluralize function
  return pluralizeEN(word)
}
