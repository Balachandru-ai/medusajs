import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { IRbacModuleService } from "@medusajs/types"

export type CreateRbacRolePolicyDTO = {
  role_id: string
  scope_id: string
  metadata?: Record<string, unknown> | null
}

export type CreateRbacRolePoliciesStepInput = {
  role_policies: CreateRbacRolePolicyDTO[]
}

export const createRbacRolePoliciesStepId = "create-rbac-role-policies"

export const createRbacRolePoliciesStep = createStep(
  createRbacRolePoliciesStepId,
  async (data: CreateRbacRolePoliciesStepInput, { container }) => {
    const service = container.resolve<IRbacModuleService>(Modules.RBAC)

    const created = await service.createRbacRolePolicies(data.role_policies)

    return new StepResponse(
      created,
      (created ?? []).map((rp) => rp.id)
    )
  },
  async (createdIds: string[] | undefined, { container }) => {
    if (!createdIds?.length) {
      return
    }

    const service = container.resolve<IRbacModuleService>(Modules.RBAC)
    await service.deleteRbacRolePolicies(createdIds)
  }
)
