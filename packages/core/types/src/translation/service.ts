import { FindConfig } from "../common"
import { RestoreReturn, SoftDeleteReturn } from "../dal"
import { IModuleService } from "../modules-sdk"
import { Context } from "../shared-context"
import {
  FilterableLocaleProps,
  FilterableTranslationProps,
  LocaleDTO,
  TranslationDTO,
} from "./common"
import {
  CreateLocaleDTO,
  CreateTranslationDTO,
  UpdateLocaleDTO,
  UpdateTranslationDTO,
} from "./mutations"
export interface ITranslationModuleService extends IModuleService {
  /**
   * This method creates locales.
   *
   * @param {CreateLocaleDTO[]} data - The locales to be created.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<LocaleDTO[]>} The created locales.
   */
  createLocales(
    data: CreateLocaleDTO[],
    sharedContext?: Context
  ): Promise<LocaleDTO[]>

  /**
   * This method creates a locale.
   *
   * @param {CreateLocaleDTO} data - The locale to be created.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<LocaleDTO>} The created locale.
   */
  createLocales(
    data: CreateLocaleDTO,
    sharedContext?: Context
  ): Promise<LocaleDTO>

  /**
   * This method updates an existing locale.
   *
   * @param {string} id - The ID of the locale.
   * @param {UpdateLocaleDTO} data - The attributes to update in the locale.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<LocaleDTO>} The updated locale.
   */
  updateLocales(
    id: string,
    data: UpdateLocaleDTO,
    sharedContext?: Context
  ): Promise<LocaleDTO>

  /**
   * This method updates existing locales.
   *
   * @param {FilterableLocaleProps} selector - The filters to apply on the retrieved locales.
   * @param {UpdateLocaleDTO} data - The attributes to update in the locale.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<LocaleDTO[]>} The updated locales.
   */
  updateLocales(
    selector: FilterableLocaleProps,
    data: UpdateLocaleDTO,
    sharedContext?: Context
  ): Promise<LocaleDTO[]>

  /**
   * This method deletes locales by their IDs.
   *
   * @param {string[]} ids - The IDs of the locales.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<void>} Resolves when the locales are deleted.
   */
  deleteLocales(ids: string[], sharedContext?: Context): Promise<void>

  /**
   * This method deletes a locale by its ID.
   *
   * @param {string} id - The ID of the locale.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<void>} Resolves when the locale is deleted.
   */
  deleteLocales(id: string, sharedContext?: Context): Promise<void>

  /**
   * This method retrieves a locale by its ID.
   *
   * @param {string} id - The ID of the locale.
   * @param {FindConfig<LocaleDTO>} config - The configurations determining how the locale is retrieved.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<LocaleDTO>} The retrieved locale.
   */
  retrieveLocale(
    id: string,
    config?: FindConfig<LocaleDTO>,
    sharedContext?: Context
  ): Promise<LocaleDTO>

  /**
   * This method retrieves a paginated list of locales based on optional filters and configuration.
   *
   * @param {FilterableLocaleProps} filters - The filters to apply on the retrieved locales.
   * @param {FindConfig<LocaleDTO>} config - The configurations determining how the locale is retrieved.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<LocaleDTO[]>} The list of locales.
   */
  listLocales(
    filters?: FilterableLocaleProps,
    config?: FindConfig<LocaleDTO>,
    sharedContext?: Context
  ): Promise<LocaleDTO[]>

  /**
   * This method retrieves a paginated list of locales along with the total count.
   *
   * @param {FilterableLocaleProps} filters - The filters to apply on the retrieved locales.
   * @param {FindConfig<LocaleDTO>} config - The configurations determining how the locale is retrieved.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<[LocaleDTO[], number]>} The list of locales along with their total count.
   */
  listAndCountLocales(
    filters?: FilterableLocaleProps,
    config?: FindConfig<LocaleDTO>,
    sharedContext?: Context
  ): Promise<[LocaleDTO[], number]>

  /**
   * This method creates translations.
   *
   * @param {CreateTranslationDTO[]} data - The translations to be created.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<TranslationDTO[]>} The created translations.
   */
  createTranslations(
    data: CreateTranslationDTO[],
    sharedContext?: Context
  ): Promise<TranslationDTO[]>

  /**
   * This method creates a translation.
   *
   * @param {CreateTranslationDTO} data - The translation to be created.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<TranslationDTO>} The created translation.
   */
  createTranslations(
    data: CreateTranslationDTO,
    sharedContext?: Context
  ): Promise<TranslationDTO>

  /**
   * This method updates an existing translation.
   *
   * @param {string} id - The ID of the translation.
   * @param {UpdateTranslationDTO} data - The attributes to update in the translation.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<TranslationDTO>} The updated translation.
   */
  updateTranslations(
    id: string,
    data: UpdateTranslationDTO,
    sharedContext?: Context
  ): Promise<TranslationDTO>

  /**
   * This method updates existing translations.
   *
   * @param {FilterableTranslationProps} selector - The filters to apply on the retrieved translations.
   * @param {UpdateTranslationDTO} data - The attributes to update in the translation.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<TranslationDTO[]>} The updated translations.
   */
  updateTranslations(
    selector: FilterableTranslationProps,
    data: UpdateTranslationDTO,
    sharedContext?: Context
  ): Promise<TranslationDTO[]>

  /**
   * This method deletes translations by their IDs.
   *
   * @param {string[]} ids - The IDs of the translations.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<void>} Resolves when the translations are deleted.
   */
  deleteTranslations(ids: string[], sharedContext?: Context): Promise<void>

  /**
   * This method deletes a translation by its ID.
   *
   * @param {string} id - The ID of the translation.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<void>} Resolves when the translation is deleted.
   */
  deleteTranslations(id: string, sharedContext?: Context): Promise<void>

  /**
   * This method retrieves a translation by its ID.
   *
   * @param {string} id - The ID of the translation.
   * @param {FindConfig<TranslationDTO>} config - The configurations determining how the translation is retrieved.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<TranslationDTO>} The retrieved translation.
   */
  retrieveTranslation(
    id: string,
    config?: FindConfig<TranslationDTO>,
    sharedContext?: Context
  ): Promise<TranslationDTO>

  /**
   * This method retrieves a paginated list of translations based on optional filters and configuration.
   *
   * @param {FilterableTranslationProps} filters - The filters to apply on the retrieved translations.
   * @param {FindConfig<TranslationDTO>} config - The configurations determining how the translation is retrieved.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<TranslationDTO[]>} The list of translations.
   */
  listTranslations(
    filters?: FilterableTranslationProps,
    config?: FindConfig<TranslationDTO>,
    sharedContext?: Context
  ): Promise<TranslationDTO[]>

  /**
   * This method retrieves a paginated list of translations along with the total count.
   *
   * @param {FilterableTranslationProps} filters - The filters to apply on the retrieved translations.
   * @param {FindConfig<TranslationDTO>} config - The configurations determining how the translation is retrieved.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<[TranslationDTO[], number]>} The list of translations along with their total count.
   */
  listAndCountTranslations(
    filters?: FilterableTranslationProps,
    config?: FindConfig<TranslationDTO>,
    sharedContext?: Context
  ): Promise<[TranslationDTO[], number]>

  /**
   * This method soft deletes translations by their IDs.
   *
   * @param {string[]} translationIds - The translations' IDs.
   * @param {SoftDeleteReturn<TReturnableLinkableKeys>} config - An object for related entities that should be soft-deleted.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<void | Record<string, string[]>>} An object with IDs of related records that were also soft deleted.
   */
  softDeleteTranslations<TReturnableLinkableKeys extends string = string>(
    translationIds: string[],
    config?: SoftDeleteReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<string, string[]> | void>

  /**
   * This method restores soft deleted translations by their IDs.
   *
   * @param {string[]} translationIds - The translations' IDs.
   * @param {RestoreReturn<TReturnableLinkableKeys>} config - Configurations determining which relations to restore.
   * @param {Context} sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns {Promise<void | Record<string, string[]>>} An object with IDs of related records that were restored.
   */
  restoreTranslations<TReturnableLinkableKeys extends string = string>(
    translationIds: string[],
    config?: RestoreReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<string, string[]> | void>
}
