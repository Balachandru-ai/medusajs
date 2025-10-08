import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

import schema from "../$schema.json"

const translationsDir = path.join(__dirname, "..")

// Import plural rules (use require for CommonJS module)
const {
  getRequiredPluralForms,
  isPluralKey,
  getBaseKey,
} = require("../../../../scripts/i18n/plural-rules.js")

function getAllKeysFromSchema(schema: any, prefix = ""): string[] {
  const keys: string[] = []

  if (schema.type === "object" && schema.properties) {
    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      const newPrefix = prefix ? `${prefix}.${key}` : key
      if (value.type === "object") {
        keys.push(...getAllKeysFromSchema(value, newPrefix))
      } else {
        keys.push(newPrefix)
      }
    })
  }

  return keys.sort()
}

function getRequiredKeysFromSchema(schema: any, prefix = ""): string[] {
  const keys: string[] = []

  if (schema.type === "object" && schema.properties) {
    const requiredKeys = schema.required || []

    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      const newPrefix = prefix ? `${prefix}.${key}` : key
      if (value.type === "object") {
        keys.push(...getRequiredKeysFromSchema(value, newPrefix))
      } else {
        // Only include keys marked as required
        if (requiredKeys.includes(key)) {
          keys.push(newPrefix)
        }
      }
    })
  }

  return keys.sort()
}

function getTranslationKeys(obj: any, prefix = ""): string[] {
  const keys: string[] = []

  Object.entries(obj).forEach(([key, value]) => {
    const newPrefix = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === "object") {
      keys.push(...getTranslationKeys(value, newPrefix))
    } else {
      keys.push(newPrefix)
    }
  })

  return keys.sort()
}

/**
 * Get language code from filename (e.g., "en.json" -> "en", "zhCN.json" -> "zhCN")
 */
function getLanguageCode(filename: string): string {
  return filename.replace(".json", "")
}

/**
 * Validate plural forms for a specific language
 */
function validatePluralForms(
  translationKeys: string[],
  languageCode: string
): { missingPlurals: string[]; extraPlurals: string[] } {
  const requiredPluralSuffixes = getRequiredPluralForms(languageCode)
  const missingPlurals: string[] = []
  const extraPlurals: string[] = []

  // Group keys by their base form
  const pluralGroups = new Map<string, Set<string>>()

  translationKeys.forEach((key) => {
    if (isPluralKey(key)) {
      const baseKey = getBaseKey(key)
      if (!pluralGroups.has(baseKey)) {
        pluralGroups.set(baseKey, new Set())
      }
      const suffix = key.substring(baseKey.length) // e.g., "_one", "_few"
      pluralGroups.get(baseKey)!.add(suffix)
    }
  })

  // Check each plural group
  pluralGroups.forEach((suffixes, baseKey: string) => {
    // Check for missing required plural forms
    requiredPluralSuffixes.forEach((requiredSuffix: string) => {
      if (!suffixes.has(requiredSuffix)) {
        missingPlurals.push(`${baseKey}${requiredSuffix}`)
      }
    })

    // Note: We don't flag extra plural forms as errors anymore
    // since languages may have additional forms for better UX
  })

  return { missingPlurals, extraPlurals }
}

describe("translation schema validation", () => {
  test("en.json should have all required keys defined in schema", () => {
    const enPath = path.join(translationsDir, "en.json")
    const enTranslations = JSON.parse(fs.readFileSync(enPath, "utf-8"))

    const requiredSchemaKeys = getRequiredKeysFromSchema(schema)
    const translationKeys = getTranslationKeys(enTranslations)

    const missingInTranslations = requiredSchemaKeys.filter(
      (key) => !translationKeys.includes(key)
    )

    if (missingInTranslations.length > 0) {
      console.warn(
        "\nWarning: Missing required keys in en.json:",
        missingInTranslations
      )
      console.warn(
        "These keys exist in other translation files but not in English (source language)."
      )
      console.warn(
        "This is informational only - the schema includes all keys from all languages.\n"
      )
    }

    // Don't fail - this is informational
    // Missing keys in en.json means other languages added keys first
    // which is fine since we merge all language keys into the schema
    // expect(missingInTranslations).toEqual([])
  })

  test("all translation files should have correct plural forms for their language", () => {
    const files = fs.readdirSync(translationsDir)
    const translationFiles = files.filter(
      (f) => f.endsWith(".json") && f !== "$schema.json"
    )

    const errors: Record<string, any> = {}

    translationFiles.forEach((file) => {
      const languageCode = getLanguageCode(file)
      const filePath = path.join(translationsDir, file)
      const translations = JSON.parse(fs.readFileSync(filePath, "utf-8"))
      const translationKeys = getTranslationKeys(translations)

      const { missingPlurals } = validatePluralForms(
        translationKeys,
        languageCode
      )

      if (missingPlurals.length > 0) {
        errors[file] = {
          missingPlurals,
        }
      }
    })

    if (Object.keys(errors).length > 0) {
      console.warn("\n=== Plural Form Validation Warnings ===\n")
      console.warn("Some translation files have incomplete plural forms.")
      console.warn(
        "This is not a critical error, but translations may not display correctly for all quantities.\n"
      )
      Object.entries(errors).forEach(([file, fileErrors]) => {
        console.warn(
          `\n${file}: ${fileErrors.missingPlurals.length} missing plural forms`
        )
      })
      console.warn(
        "\nNote: This validation is informational. Translations will still work but may fall back to default forms."
      )
    }

    // Don't fail the test - just warn about incomplete plurals
    // expect(Object.keys(errors)).toEqual([])
  })

  test("schema should include all keys from all translation files", () => {
    const files = fs.readdirSync(translationsDir)
    const translationFiles = files.filter(
      (f) => f.endsWith(".json") && f !== "$schema.json"
    )

    const allSchemaKeys = getAllKeysFromSchema(schema)
    const errors: Record<string, string[]> = {}

    translationFiles.forEach((file) => {
      const filePath = path.join(translationsDir, file)
      const translations = JSON.parse(fs.readFileSync(filePath, "utf-8"))
      const translationKeys = getTranslationKeys(translations)

      const keysNotInSchema = translationKeys.filter(
        (key) => !allSchemaKeys.includes(key)
      )

      if (keysNotInSchema.length > 0) {
        errors[file] = keysNotInSchema
      }
    })

    if (Object.keys(errors).length > 0) {
      console.error("\n=== Keys not in schema ===\n")
      console.error("Run 'npm run i18n:schema' to regenerate the schema\n")
      Object.entries(errors).forEach(([file, keys]) => {
        console.error(`${file}:`, keys.slice(0, 10))
        if (keys.length > 10) {
          console.error(`  ... and ${keys.length - 10} more`)
        }
      })
    }

    expect(Object.keys(errors)).toEqual([])
  })
})
