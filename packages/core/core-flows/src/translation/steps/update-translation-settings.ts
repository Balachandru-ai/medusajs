import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateTranslationSettingsDTO } from "@medusajs/types"

export const updateTranslationSettingsStepId = "update-translation-settings"

export type UpdateTranslationSettingsStepInput =
  | UpdateTranslationSettingsDTO
  | UpdateTranslationSettingsDTO[]

export const updateTranslationSettingsStep = createStep(
  updateTranslationSettingsStepId,
  async (data: UpdateTranslationSettingsStepInput, { container }) => {
    const service = container.resolve(Modules.TRANSLATION)

    const normalizedInput = Array.isArray(data) ? data : [data]

    const previous = await service.listTranslationSettings({
      id: normalizedInput.map((d) => d.id),
    })

    const updated = await service.updateTranslationSettings(normalizedInput)

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
