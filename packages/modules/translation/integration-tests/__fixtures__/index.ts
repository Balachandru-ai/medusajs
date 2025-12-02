import { TranslationTypes } from "@medusajs/framework/types"

export const createLocaleFixture: TranslationTypes.CreateLocaleDTO = {
  code: "test-LC",
  name: "Test Locale",
}

export const createTranslationFixture: TranslationTypes.CreateTranslationDTO = {
  entity_id: "prod_123",
  entity_type: "product",
  locale_code: "fr-FR",
  translations: {
    title: "Titre du produit",
    description: "Description du produit en français",
  },
}
