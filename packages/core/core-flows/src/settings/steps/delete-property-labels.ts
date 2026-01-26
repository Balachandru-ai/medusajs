import { SettingsTypes } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export interface DeletePropertyLabelsStepInput {
  ids: string[]
}

export const deletePropertyLabelsStepId = "delete-property-labels"

/**
 * @since 2.10.3
 * @featureFlag view_configurations
 */
export const deletePropertyLabelsStep = createStep(
  deletePropertyLabelsStepId,
  async (
    data: DeletePropertyLabelsStepInput,
    { container }
  ): Promise<StepResponse<void, SettingsTypes.PropertyLabelDTO[]>> => {
    if (!data.ids?.length) {
      return new StepResponse(void 0, [])
    }

    const service = container.resolve<SettingsTypes.ISettingsModuleService>(
      Modules.SETTINGS
    )

    // Get the current state for compensation
    const existing = await service.listPropertyLabels({
      id: data.ids,
    })

    await service.deletePropertyLabels(data.ids)

    return new StepResponse(void 0, existing)
  },
  async (previousLabels, { container }) => {
    if (!previousLabels?.length) {
      return
    }

    const service = container.resolve<SettingsTypes.ISettingsModuleService>(
      Modules.SETTINGS
    )

    // Restore the deleted labels
    await service.createPropertyLabels(
      previousLabels.map((label) => ({
        entity: label.entity,
        property: label.property,
        label: label.label,
        description: label.description ?? undefined,
      }))
    )
  }
)
