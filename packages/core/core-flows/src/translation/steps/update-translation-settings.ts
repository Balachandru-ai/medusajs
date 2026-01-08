import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateTranslationSettingsDTO } from "@medusajs/types"

export const updateTranslationSettingsStepId = "update-translation-settings"

export type UpdateTranslationSettingsStepInput = UpdateTranslationSettingsDTO[]

export const updateTranslationSettingsStep = createStep(
  updateTranslationSettingsStepId,
  async (data: UpdateTranslationSettingsStepInput, { container }) => {
    const service = container.resolve(Modules.TRANSLATION)

    const previous = await service.listTranslationSettings({
      id: data.map((d) => d.id),
    })

    const updated = await service.updateTranslationSettings(data)

    return new StepResponse(updated, previous)
  },
  async (previous, { container }) => {
    if (!previous?.length) {
      return
    }

    const service = container.resolve(Modules.TRANSLATION)

    await service.updateTranslationSettings(previous)
  }
)
