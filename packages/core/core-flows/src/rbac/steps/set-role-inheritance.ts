import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { IRbacModuleService } from "@medusajs/types"

export type SetRoleInheritanceStepInput = Array<{
  role_id: string
  inherited_role_ids: string[]
}>

export const setRoleInheritanceStepId = "set-role-inheritance"

export const setRoleInheritanceStep = createStep(
  setRoleInheritanceStepId,
  async (data: SetRoleInheritanceStepInput, { container }) => {
    const service = container.resolve<IRbacModuleService>(Modules.RBAC)

    const allCompensationData: Array<{
      role_id: string
      previousInheritedRoleIds: string[]
    }> = []

    if (!data || data.length === 0) {
      return new StepResponse(
        { created: [], removedCount: 0 },
        allCompensationData
      )
    }

    const allToRemoveIds: string[] = []
    const allToCreate: Array<{
      role_id: string
      inherited_role_id: string
    }> = []

    for (const roleData of data) {
      const existingInheritance = await service.listRbacRoleInheritances({
        role_id: roleData.role_id,
      })

      const existingInheritedRoleIds = existingInheritance.map(
        (ri) => ri.inherited_role_id
      )

      allCompensationData.push({
        role_id: roleData.role_id,
        previousInheritedRoleIds: existingInheritedRoleIds,
      })

      const toAdd = roleData.inherited_role_ids.filter(
        (id) => !existingInheritedRoleIds.includes(id)
      )
      const toRemove = existingInheritedRoleIds.filter(
        (id) => !roleData.inherited_role_ids.includes(id)
      )

      if (toRemove.length > 0) {
        const toRemoveRecords = existingInheritance.filter((ri) =>
          toRemove.includes(ri.inherited_role_id)
        )
        allToRemoveIds.push(...toRemoveRecords.map((ri) => ri.id))
      }

      if (toAdd.length > 0) {
        allToCreate.push(
          ...toAdd.map((inherited_role_id) => ({
            role_id: roleData.role_id,
            inherited_role_id,
          }))
        )
      }
    }

    if (allToRemoveIds.length > 0) {
      await service.deleteRbacRoleInheritances(allToRemoveIds)
    }

    let created: any[] = []
    if (allToCreate.length > 0) {
      created = await service.createRbacRoleInheritances(allToCreate)
    }

    return new StepResponse(
      { created, removedCount: allToRemoveIds.length },
      allCompensationData
    )
  },
  async (
    compensationData:
      | Array<{ role_id: string; previousInheritedRoleIds: string[] }>
      | undefined,
    { container }
  ) => {
    if (!compensationData || compensationData.length === 0) {
      return
    }

    const service = container.resolve<IRbacModuleService>(Modules.RBAC)

    for (const roleCompensation of compensationData) {
      const currentInheritance = await service.listRbacRoleInheritances({
        role_id: roleCompensation.role_id,
      })

      if (currentInheritance.length > 0) {
        await service.deleteRbacRoleInheritances(
          currentInheritance.map((ri) => ri.id)
        )
      }

      if (roleCompensation.previousInheritedRoleIds.length > 0) {
        await service.createRbacRoleInheritances(
          roleCompensation.previousInheritedRoleIds.map(
            (inherited_role_id) => ({
              role_id: roleCompensation.role_id,
              inherited_role_id,
            })
          )
        )
      }
    }
  }
)
