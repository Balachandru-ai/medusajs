import { TranslationDTO } from "../../../translation/common"
import { PaginatedResponse } from "../../common"

export interface AdminTranslationsResponse {
  /**
   * The list of translations.
   */
  translation: TranslationDTO
}

export type AdminTranslationsListResponse = PaginatedResponse<{
  /**
   * The list of translations.
   */
  translations: TranslationDTO[]
}>
