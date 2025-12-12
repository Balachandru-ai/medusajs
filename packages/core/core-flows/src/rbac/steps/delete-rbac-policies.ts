import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { IRbacModuleService } from "@medusajs/types"

export type DeleteRbacPoliciesStepInput = string[]

export const deleteRbacPoliciesStepId = "delete-rbac-policies"

export const deleteRbacPoliciesStep = createStep(
  { name: deleteRbacPoliciesStepId, noCompensation: true },
  async (ids: DeleteRbacPoliciesStepInput, { container }) => {
    const service = container.resolve<IRbacModuleService>(Modules.RBAC)
    await service.deleteRbacPolicies(ids)
    return new StepResponse(void 0)
  },
  async () => {}
)
