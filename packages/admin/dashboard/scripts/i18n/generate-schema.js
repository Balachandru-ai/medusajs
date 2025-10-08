const fs = require("fs/promises")
const path = require("path")
const prettier = require("prettier")
const { isPluralKey } = require("./plural-rules")

const translationsDir = path.join(__dirname, "../../src/i18n/translations")
const enPath = path.join(translationsDir, "en.json")
const schemaPath = path.join(translationsDir, "$schema.json")

/**
 * Merge translation objects from all languages to collect all possible keys
 * This ensures the schema includes plural forms from all languages
 */
function mergeTranslationObjects(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Recursively merge nested objects
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {}
      }
      mergeTranslationObjects(target[key], value)
    } else {
      // For leaf values, just ensure the key exists
      if (!target.hasOwnProperty(key)) {
        target[key] = value
      }
    }
  }
}

/**
 * Load all translation files and merge their structures
 */
async function loadAllTranslationKeys() {
  const files = await fs.readdir(translationsDir)
  const translationFiles = files.filter(
    (f) => f.endsWith(".json") && f !== "$schema.json"
  )

  // Start with English as the base
  const enContent = await fs.readFile(enPath, "utf-8")
  const mergedStructure = JSON.parse(enContent)

  console.log(`Merging keys from ${translationFiles.length} translation files...`)

  // Merge all other translation files
  for (const file of translationFiles) {
    if (file === "en.json") continue

    try {
      const filePath = path.join(translationsDir, file)
      const content = await fs.readFile(filePath, "utf-8")
      const json = JSON.parse(content)
      mergeTranslationObjects(mergedStructure, json)
    } catch (error) {
      console.warn(`Warning: Could not process ${file}:`, error.message)
    }
  }

  return mergedStructure
}

function generateSchemaFromObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    return { type: typeof obj }
  }

  if (Array.isArray(obj)) {
    return {
      type: "array",
      items: generateSchemaFromObject(obj[0] || "string"),
    }
  }

  const properties = {}
  const required = []

  Object.entries(obj).forEach(([key, value]) => {
    properties[key] = generateSchemaFromObject(value)

    // Mark plural keys as optional since different languages need different forms
    // Only require non-plural keys
    if (!isPluralKey(key)) {
      required.push(key)
    }
  })

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  }
}

async function outputSchema() {
  try {
    // Load and merge all translation keys
    const allKeys = await loadAllTranslationKeys()

    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      ...generateSchemaFromObject(allKeys),
    }

    const formattedSchema = await prettier.format(
      JSON.stringify(schema, null, 2),
      {
        parser: "json",
      }
    )

    await fs.writeFile(schemaPath, formattedSchema)
    console.log("Schema generated successfully at:", schemaPath)
    console.log("Note: Plural forms (_zero, _one, _two, _few, _many, _other) are marked as optional")
  } catch (error) {
    console.error("Error generating schema:", error.message)
    process.exit(1)
  }
}

outputSchema()