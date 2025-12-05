import { model } from "@medusajs/framework/utils"

const Translation = model
  .define("translation", {
    id: model.id({ prefix: "trans" }).primaryKey(),
    entity_id: model.text().searchable(),
    entity_type: model.text().searchable(), // e.g., "product", "product_variant", "product_category"
    locale_code: model.text().searchable(), // BCP 47 language tag, e.g., "en-US", "da-DK"
    translations: model.json(), // JSON object containing translated fields, e.g., { "title": "...", "description": "..." }
  })
  .indexes([
    {
      on: ["entity_id", "locale_code"],
      unique: true,
    },
    {
      on: ["entity_id", "entity_type"],
    },
    {
      on: ["locale_code"],
    },
  ])

export default Translation
