import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateTranslationSettingsDTO } from "@medusajs/types"

export const createTranslationSettingsStepId = "create-translation-settings"

export type CreateTranslationSettingsStepInput = CreateTranslationSettingsDTO[]

export const createTranslationSettingsStep = createStep(
  createTranslationSettingsStepId,
  async (data: CreateTranslationSettingsStepInput, { container }) => {
    const service = container.resolve(Modules.TRANSLATION)

    const created = await service.createTranslationSettings(data)

    return new StepResponse(
      created,
      created.map((translationSettings) => translationSettings.id)
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) {
      return
    }

    const service = container.resolve(Modules.TRANSLATION)

    await service.deleteTranslationSettings(createdIds)
  }
)
