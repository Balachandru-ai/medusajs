import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { IRbacModuleService } from "@medusajs/types"

export type CreateRbacPolicyDTO = {
  key: string
  resource: string
  operation: string
  name?: string | null
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export type CreateRbacPoliciesStepInput = {
  policies: CreateRbacPolicyDTO[]
}

export const createRbacPoliciesStepId = "create-rbac-policies"

export const createRbacPoliciesStep = createStep(
  createRbacPoliciesStepId,
  async (data: CreateRbacPoliciesStepInput, { container }) => {
    const service = container.resolve<IRbacModuleService>(Modules.RBAC)

    const created = await service.createRbacPolicies(data.policies)

    return new StepResponse(
      created,
      (created ?? []).map((p) => p.id)
    )
  },
  async (createdIds: string[] | undefined, { container }) => {
    if (!createdIds?.length) {
      return
    }

    const service = container.resolve<IRbacModuleService>(Modules.RBAC)
    await service.deleteRbacPolicies(createdIds)
  }
)
