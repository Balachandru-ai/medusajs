import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { IRbacModuleService } from "@medusajs/types"

export type DeleteRbacRolesStepInput = string[]

export const deleteRbacRolesStepId = "delete-rbac-roles"

export const deleteRbacRolesStep = createStep(
  { name: deleteRbacRolesStepId, noCompensation: true },
  async (ids: DeleteRbacRolesStepInput, { container }) => {
    const service = container.resolve<IRbacModuleService>(Modules.RBAC)
    await service.deleteRbacRoles(ids)
    return new StepResponse(void 0)
  },
  async () => {}
)
