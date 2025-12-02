import {
  FilterableTranslationProps,
  ITranslationModuleService,
  UpdateTranslationDTO,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The data to update translations.
 */
export type UpdateTranslationsStepInput = {
  /**
   * The filters to select the translations to update.
   */
  selector: FilterableTranslationProps
  /**
   * The data to update in the translations.
   */
  update: UpdateTranslationDTO
}

export const updateTranslationsStepId = "update-translations"
/**
 * This step updates translations matching the specified filters.
 *
 * @example
 * const data = updateTranslationsStep({
 *   selector: {
 *     entity_id: "prod_123",
 *     locale_code: "fr-FR"
 *   },
 *   update: {
 *     translations: { title: "Nouveau titre" }
 *   }
 * })
 */
export const updateTranslationsStep = createStep(
  updateTranslationsStepId,
  async (data: UpdateTranslationsStepInput, { container }) => {
    const service = container.resolve<ITranslationModuleService>(
      Modules.TRANSLATION
    )

    const prevData = await service.listTranslations(data.selector, {
      select: ["id", "entity_id", "entity_type", "locale_code", "translations"],
    })

    if (Object.keys(data.update).length === 0) {
      return new StepResponse(prevData, [])
    }

    const translations = await service.updateTranslations({
      selector: data.selector,
      data: data.update,
    })

    return new StepResponse(translations, prevData)
  },
  async (prevData, { container }) => {
    if (!prevData?.length) {
      return
    }

    const service = container.resolve<ITranslationModuleService>(
      Modules.TRANSLATION
    )

    await service.updateTranslations(
      prevData.map((t) => ({
        id: t.id,
        entity_id: t.entity_id,
        entity_type: t.entity_type,
        locale_code: t.locale_code,
        translations: t.translations,
      }))
    )
  }
)
