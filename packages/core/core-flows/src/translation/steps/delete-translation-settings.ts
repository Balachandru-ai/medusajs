import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const deleteTranslationSettingsStepId = "delete-translation-settings"

export const deleteTranslationSettingsStep = createStep(
  deleteTranslationSettingsStepId,
  async (data: string[], { container }) => {
    const service = container.resolve(Modules.TRANSLATION)

    const previous = await service.listTranslationSettings({
      id: data,
    })

    await service.deleteTranslationSettings(data)

    return new StepResponse(void 0, previous)
  },
  async (previous, { container }) => {
    if (!previous?.length) {
      return
    }

    const service = container.resolve(Modules.TRANSLATION)

    await service.createTranslationSettings(previous)
  }
)
