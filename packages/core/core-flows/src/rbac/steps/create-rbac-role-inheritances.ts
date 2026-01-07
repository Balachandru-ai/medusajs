import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { IRbacModuleService } from "@medusajs/types"

export type CreateRbacRoleInheritanceDTO = {
  role_id: string
  inherited_role_id: string
  metadata?: Record<string, unknown> | null
}

export type CreateRbacRoleInheritancesStepInput = {
  role_inheritances: CreateRbacRoleInheritanceDTO[]
}

export const createRbacRoleInheritancesStepId = "create-rbac-role-inheritances"

export const createRbacRoleInheritancesStep = createStep(
  createRbacRoleInheritancesStepId,
  async (data: CreateRbacRoleInheritancesStepInput, { container }) => {
    const service = container.resolve<IRbacModuleService>(Modules.RBAC)

    if (!data.role_inheritances || data.role_inheritances.length === 0) {
      return new StepResponse([], [])
    }

    const created = await service.createRbacRoleInheritances(
      data.role_inheritances
    )

    return new StepResponse(
      created,
      (created ?? []).map((ri) => ri.id)
    )
  },
  async (createdIds: string[] | undefined, { container }) => {
    if (!createdIds?.length) {
      return
    }

    const service = container.resolve<IRbacModuleService>(Modules.RBAC)
    await service.deleteRbacRoleInheritances(createdIds)
  }
)
