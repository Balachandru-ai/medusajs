import { raw } from "@medusajs/framework/mikro-orm/core"
import {
  Context,
  CreateLocaleDTO,
  CreateTranslationDTO,
  DAL,
  FilterableTranslationProps,
  FindConfig,
  ITranslationModuleService,
  LocaleDTO,
  ModulesSdkTypes,
  TranslationTypes,
} from "@medusajs/framework/types"
import {
  InjectManager,
  MedusaContext,
  MedusaService,
  normalizeLocale,
} from "@medusajs/framework/utils"
import Locale from "@models/locale"
import Translation from "@models/translation"

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
  translationService: ModulesSdkTypes.IMedusaInternalService<typeof Translation>
  localeService: ModulesSdkTypes.IMedusaInternalService<typeof Locale>
}

export default class TranslationModuleService
  extends MedusaService({
    Locale,
    Translation,
  })
  implements ITranslationModuleService
{
  protected baseRepository_: DAL.RepositoryService
  protected translationService_: ModulesSdkTypes.IMedusaInternalService<
    typeof Translation
  >
  protected localeService_: ModulesSdkTypes.IMedusaInternalService<
    typeof Locale
  >

  constructor({
    baseRepository,
    translationService,
    localeService,
  }: InjectedDependencies) {
    super(...arguments)
    this.baseRepository_ = baseRepository
    this.translationService_ = translationService
    this.localeService_ = localeService
  }

  static prepareFilters(
    filters: FilterableTranslationProps
  ): FilterableTranslationProps {
    let { q, ...restFilters } = filters

    if (q) {
      restFilters = {
        ...restFilters,
        [raw(`translations::text ILIKE ?`, [`%${q}%`])]: [],
      }
    }

    return restFilters
  }

  @InjectManager()
  // @ts-expect-error
  async listTranslations(
    filters: FilterableTranslationProps = {},
    config: FindConfig<TranslationTypes.TranslationDTO> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<TranslationTypes.TranslationDTO[]> {
    const preparedFilters = TranslationModuleService.prepareFilters(filters)

    const results = await this.translationService_.list(
      preparedFilters,
      config,
      sharedContext
    )

    return await this.baseRepository_.serialize<
      TranslationTypes.TranslationDTO[]
    >(results)
  }

  @InjectManager()
  // @ts-expect-error
  async listAndCountTranslations(
    filters: FilterableTranslationProps = {},
    config: FindConfig<TranslationTypes.TranslationDTO> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<[TranslationTypes.TranslationDTO[], number]> {
    const preparedFilters = TranslationModuleService.prepareFilters(filters)

    const [results, count] = await this.translationService_.listAndCount(
      preparedFilters,
      config,
      sharedContext
    )

    return [
      await this.baseRepository_.serialize<TranslationTypes.TranslationDTO[]>(
        results
      ),
      count,
    ]
  }

  @InjectManager()
  // @ts-expect-error
  async createLocales(
    data: CreateLocaleDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<LocaleDTO[]> {
    const normalizedData = data.map((locale) => ({
      ...locale,
      code: normalizeLocale(locale.code),
    }))

    const createdLocales = await this.localeService_.create(
      normalizedData,
      sharedContext
    )

    return await this.baseRepository_.serialize<LocaleDTO[]>(createdLocales)
  }

  @InjectManager()
  // @ts-expect-error
  async createTranslations(
    data: CreateTranslationDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<TranslationTypes.TranslationDTO[]> {
    const normalizedData = data.map((translation) => ({
      ...translation,
      locale_code: normalizeLocale(translation.locale_code),
    }))

    const createdTranslations = await this.translationService_.create(
      normalizedData,
      sharedContext
    )

    return await this.baseRepository_.serialize<
      TranslationTypes.TranslationDTO[]
    >(createdTranslations)
  }
}
