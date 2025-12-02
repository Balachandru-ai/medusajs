import { raw } from "@medusajs/framework/mikro-orm/core"
import {
  Context,
  DAL,
  FilterableTranslationProps,
  FindConfig,
  ITranslationModuleService,
  ModulesSdkTypes,
  TranslationTypes,
} from "@medusajs/framework/types"
import {
  InjectManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils"
import Locale from "@models/locale"
import Translation from "@models/translation"

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
  translationService: ModulesSdkTypes.IMedusaInternalService<typeof Translation>
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

  constructor({ baseRepository, translationService }: InjectedDependencies) {
    super(...arguments)
    this.baseRepository_ = baseRepository
    this.translationService_ = translationService
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
}
