import { PaginatedResponse } from "../../common"
import { AdminTranslation } from "./entities"

export interface AdminTranslationsResponse {
  /**
   * The list of translations.
   */
  translation: AdminTranslation
}

export type AdminTranslationsListResponse = PaginatedResponse<{
  /**
   * The list of translations.
   */
  translations: AdminTranslation[]
}>

export interface AdminTranslationsBatchResponse {
  /**
   * The created translations.
   */
  created: AdminTranslation[]
  /**
   * The updated translations.
   */
  updated: AdminTranslation[]
  /**
   * The deleted translations.
   */
  deleted: {
    ids: string[]
    object: "translation"
    deleted: boolean
  }
}

/**
 * Statistics for a specific locale.
 */
export interface AdminTranslationLocaleStatistics {
  /**
   * Expected number of translated fields.
   */
  expected: number
  /**
   * Actual number of translated fields.
   */
  translated: number
  /**
   * Number of missing translations.
   */
  missing: number
}

/**
 * Statistics for an entity type.
 */
export interface AdminTranslationEntityStatistics
  extends AdminTranslationLocaleStatistics {
  /**
   * Breakdown of statistics by locale.
   */
  byLocale: Record<string, AdminTranslationLocaleStatistics>
}

/**
 * Response for translation statistics endpoint.
 */
export interface AdminTranslationStatisticsResponse {
  /**
   * Statistics by entity type.
   */
  statistics: Record<string, AdminTranslationEntityStatistics>
}
