import { model } from "@medusajs/framework/utils"

const Locale = model.define("locale", {
  code: model.text().searchable().primaryKey(), // BCP 47 language tag, e.g., "en-US", "da-DK"
  name: model.text().searchable(), // Human-readable name, e.g., "English (US)", "Danish"
})

export default Locale
