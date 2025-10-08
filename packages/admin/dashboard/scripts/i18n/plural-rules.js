/**
 * CLDR Plural Rules for supported languages
 *
 * Based on Unicode CLDR (Common Locale Data Repository)
 * Reference: https://www.unicode.org/cldr/charts/47/supplemental/language_plural_rules.html
 *
 * Plural categories:
 * - zero: Used for zero in some languages (Arabic, etc.)
 * - one: Singular form
 * - two: Dual form (Arabic, Hebrew, etc.)
 * - few: Used for small quantities (Slavic languages)
 * - many: Used for larger quantities (Slavic languages)
 * - other: Default/fallback form (always required)
 *
 * Note: Languages like Chinese, Japanese, Korean, Thai, Vietnamese don't distinguish
 * plural forms grammatically, so they only use "other" category.
 */

const PLURAL_RULES = {
  // Arabic - all 6 categories
  ar: ["zero", "one", "two", "few", "many", "other"],

  // Bulgarian - simple system
  bg: ["one", "other"],

  // Bosnian - Slavic system without many
  bs: ["one", "few", "other"],

  // Czech - full Slavic system
  cs: ["one", "few", "many", "other"],

  // German - simple system
  de: ["one", "other"],

  // Greek - simple system
  el: ["one", "other"],

  // English - simple system (reference language)
  en: ["one", "other"],

  // Spanish - simple system
  es: ["one", "other"],

  // Persian (Farsi) - simple system
  fa: ["one", "other"],

  // French - has "many" for special cases
  fr: ["one", "many", "other"],

  // Hebrew - includes dual form
  he: ["one", "two", "other"],

  // Hungarian - simple system
  hu: ["one", "other"],

  // Indonesian - no plural distinction
  id: ["other"],

  // Italian - has "many" for special cases
  it: ["one", "many", "other"],

  // Japanese - no plural distinction
  ja: ["other"],

  // Korean - no plural distinction
  ko: ["other"],

  // Lithuanian - full Slavic system
  lt: ["one", "few", "many", "other"],

  // Macedonian - includes dual form
  mk: ["one", "two", "many", "other"],

  // Mongolian - simple system
  mn: ["one", "other"],

  // Dutch - simple system
  nl: ["one", "other"],

  // Polish - full Slavic system
  pl: ["one", "few", "many", "other"],

  // Portuguese (Brazilian) - has "many" for special cases
  ptBR: ["one", "many", "other"],

  // Romanian - Slavic-influenced system
  ro: ["one", "few", "other"],

  // Russian - full Slavic system
  ru: ["one", "few", "many", "other"],

  // Thai - no plural distinction
  th: ["other"],

  // Turkish - simple system
  tr: ["one", "other"],

  // Ukrainian - full Slavic system
  uk: ["one", "few", "many", "other"],

  // Vietnamese - no plural distinction
  vi: ["other"],

  // Chinese (Simplified) - no plural distinction
  zhCN: ["other"],
}

/**
 * Get the required plural forms for a language
 * @param {string} languageCode - The language code (e.g., 'en', 'pl', 'zhCN')
 * @returns {string[]} Array of required plural suffixes with underscore prefix
 */
function getRequiredPluralForms(languageCode) {
  const categories = PLURAL_RULES[languageCode]

  if (!categories) {
    console.warn(`Warning: Unknown language code "${languageCode}". Defaulting to English rules.`)
    return ["_one", "_other"]
  }

  // Convert categories to i18next suffix format (e.g., "one" -> "_one")
  return categories.map(category => `_${category}`)
}

/**
 * Get all possible plural suffixes across all languages
 * @returns {string[]} Array of all plural suffixes
 */
function getAllPluralSuffixes() {
  const allCategories = new Set()

  Object.values(PLURAL_RULES).forEach(categories => {
    categories.forEach(category => allCategories.add(`_${category}`))
  })

  return Array.from(allCategories).sort()
}

/**
 * Check if a key ends with a plural suffix
 * @param {string} key - The key to check
 * @returns {boolean}
 */
function isPluralKey(key) {
  const pluralSuffixes = getAllPluralSuffixes()
  return pluralSuffixes.some(suffix => key.endsWith(suffix))
}

/**
 * Extract the base key from a pluralized key
 * @param {string} key - The pluralized key (e.g., "items_few")
 * @returns {string} The base key (e.g., "items")
 */
function getBaseKey(key) {
  const pluralSuffixes = getAllPluralSuffixes()

  for (const suffix of pluralSuffixes) {
    if (key.endsWith(suffix)) {
      return key.slice(0, -suffix.length)
    }
  }

  return key
}

module.exports = {
  PLURAL_RULES,
  getRequiredPluralForms,
  getAllPluralSuffixes,
  isPluralKey,
  getBaseKey,
}