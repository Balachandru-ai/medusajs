const fs = require("fs/promises")
const path = require("path")
const prettier = require("prettier")

const translationsDir = path.join(__dirname, "../../src/i18n/translations")
const enPath = path.join(translationsDir, "en.json")
const schemaPath = path.join(translationsDir, "$schema.json")

const ALL_PLURAL_FORMS = ["zero", "one", "two", "few", "many", "other"]

function getBaseKey(key) {
  for (const form of ALL_PLURAL_FORMS) {
    if (key.endsWith(`_${form}`)) {
      return key.slice(0, -(form.length + 1))
    }
  }
  return null
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
  const localPluralBaseKeys = new Set()

  Object.keys(obj).forEach((key) => {
    const baseKey = getBaseKey(key)
    if (baseKey) {
      localPluralBaseKeys.add(baseKey)
    }
  })

  Object.entries(obj).forEach(([key, value]) => {
    if (getBaseKey(key)) return

    properties[key] = generateSchemaFromObject(value)
    required.push(key)
  })

  localPluralBaseKeys.forEach((baseKey) => {
    ALL_PLURAL_FORMS.forEach((form) => {
      properties[`${baseKey}_${form}`] = { type: "string" }
    })
  })

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  }
}

async function main() {
  const enContent = await fs.readFile(enPath, "utf-8")
  const enJson = JSON.parse(enContent)

  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    ...generateSchemaFromObject(enJson),
  }

  const formattedSchema = await prettier.format(
    JSON.stringify(schema, null, 2),
    {
      parser: "json",
    }
  )

  await fs
    .writeFile(schemaPath, formattedSchema)
    .then(() => {
      console.log("Schema generated successfully at:", schemaPath)
    })
    .catch((error) => {
      console.error("Error generating schema:", error.message)
      process.exit(1)
    })
}

main()
