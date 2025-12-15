import { BaseFilterable } from "../../.."
import { FindParams } from "../../common/request"

export interface AdminTranslationsListParams
  extends FindParams,
    BaseFilterable<AdminTranslationsListParams> {
  /**
   * Query or keywords to search the translations searchable fields.
   */
  q?: string
  /**
   * Filter by entity ID.
   */
  reference_id?: string | string[]
  /**
   * Filter by entity type.
   */
  reference?: string
  /**
   * Filter by locale code.
   */
  locale_code?: string | string[]
}

/**
 * Request body for translation statistics endpoint.
 */
export interface AdminTranslationStatisticsParams {
  /**
   * The locales to check translations for (e.g., ["en-US", "fr-FR"]).
   */
  locales: string[]

  /**
   * The entity types to get statistics for (e.g., ["product", "product_variant"]).
   */
  entity_types: string[]
}
