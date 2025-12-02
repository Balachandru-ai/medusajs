import { BaseFilterable, OperatorMap } from "../dal"

/**
 * The locale details.
 */
export interface LocaleDTO {
  /**
   * The ID of the locale.
   */
  id: string

  /**
   * The BCP 47 language tag code of the locale (e.g., "en-US", "fr-FR").
   */
  code: string

  /**
   * The human-readable name of the locale (e.g., "English (United States)").
   */
  name: string
}

/**
 * The translation details.
 */
export interface TranslationDTO {
  /**
   * The ID of the translation.
   */
  id: string

  /**
   * The ID of the entity being translated.
   */
  entity_id: string

  /**
   * The type of entity being translated (e.g., "product", "product_variant").
   */
  entity_type: string

  /**
   * The BCP 47 language tag code for this translation (e.g., "en-US", "fr-FR").
   */
  locale_code: string

  /**
   * The translated fields as key-value pairs.
   */
  translations: Record<string, unknown>
}

/**
 * The filters to apply on the retrieved locales.
 */
export interface FilterableLocaleProps
  extends BaseFilterable<FilterableLocaleProps> {
  /**
   * The IDs to filter the locales by.
   */
  id?: string[] | string | OperatorMap<string | string[]>

  /**
   * Filter locales by their code.
   */
  code?: string | string[] | OperatorMap<string>

  /**
   * Filter locales by their name.
   */
  name?: string | OperatorMap<string>
}

/**
 * The filters to apply on the retrieved translations.
 */
export interface FilterableTranslationProps
  extends BaseFilterable<FilterableTranslationProps> {
  /**
   * The IDs to filter the translations by.
   */
  id?: string[] | string | OperatorMap<string | string[]>

  /**
   * Filter translations by entity ID.
   */
  entity_id?: string | string[] | OperatorMap<string>

  /**
   * Filter translations by entity type.
   */
  entity_type?: string | string[] | OperatorMap<string>

  /**
   * Filter translations by locale code.
   */
  locale_code?: string | string[] | OperatorMap<string>
}
