import {
  CreateViewConfigurationDTO,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type CreateViewConfigurationStepInput = CreateViewConfigurationDTO

export const createViewConfigurationStepId = "create-view-configuration"

/**
 * @ignore
 * 
 * @privateRemarks
 * Remove the `ignore` tag once the feature is ready. Otherwise,
 * it will be generated in the documentation.
 */
export const createViewConfigurationStep = createStep(
  createViewConfigurationStepId,
  async (data: CreateViewConfigurationStepInput, { container }) => {
    const service = container.resolve(Modules.SETTINGS)
    const created = await service.createViewConfigurations(data)
    
    return new StepResponse(created, { id: created.id })
  },
  async (compensateInput, { container }) => {
    if (!compensateInput?.id) {
      return
    }

    const service = container.resolve(Modules.SETTINGS)
    await service.deleteViewConfigurations([compensateInput.id])
  }
)
