import { FulfillmentTypes, IFulfillmentModuleService, } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const createShippingOptionTypesStepId = "create-shipping-option-types"
/**
 * This step creates one or more shipping option types.
 */
export const createShippingOptionTypesStep = createStep(
  createShippingOptionTypesStepId,
  async (data: FulfillmentTypes.CreateShippingOptionTypeDTO[], { container }) => {
    const service = container.resolve<IFulfillmentModuleService>(Modules.FULFILLMENT)

    const created = await service.createShippingOptionTypes(data)
    return new StepResponse(
      created,
      created.map((shippingOptionType) => shippingOptionType.id)
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) {
      return
    }

    const service = container.resolve<IFulfillmentModuleService>(Modules.FULFILLMENT)

    await service.deleteShippingOptionTypes(createdIds)
  }
)
