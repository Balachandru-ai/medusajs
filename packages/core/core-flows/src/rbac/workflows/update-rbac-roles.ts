import { isDefined } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { UpdateRbacRoleDTO } from "@medusajs/types"
import { createRbacRolePoliciesStep, setRoleInheritanceStep } from "../steps"
import { updateRbacRolesStep } from "../steps/update-rbac-roles"

export type UpdateRbacRolesWorkflowInput = {
  selector: Record<string, any>
  update: Omit<UpdateRbacRoleDTO, "id"> & {
    inherited_role_ids?: string[]
    policy_ids?: string[]
  }
}

export const updateRbacRolesWorkflowId = "update-rbac-roles"

export const updateRbacRolesWorkflow = createWorkflow(
  updateRbacRolesWorkflowId,
  (input: WorkflowData<UpdateRbacRolesWorkflowInput>) => {
    const roleUpdateData = transform({ input }, ({ input }) => ({
      selector: input.selector,
      update: {
        name: input.update.name,
        description: input.update.description,
        metadata: input.update.metadata,
      },
    }))

    const updatedRoles = updateRbacRolesStep(roleUpdateData)

    const inheritanceUpdateData = transform(
      { input, updatedRoles },
      ({ input, updatedRoles }) => {
        if (!isDefined(input.update.inherited_role_ids)) {
          return []
        }

        return updatedRoles.map((role) => ({
          role_id: role.id,
          inherited_role_ids: input.update.inherited_role_ids || [],
        }))
      }
    )

    setRoleInheritanceStep(inheritanceUpdateData)

    const policiesUpdateData = transform(
      { input, updatedRoles },
      ({ input, updatedRoles }) => {
        if (!isDefined(input.update.policy_ids)) {
          return { role_policies: [] }
        }

        const allPolicies: any[] = []
        updatedRoles.forEach((role) => {
          const policyIds = input.update.policy_ids || []
          policyIds.forEach((policy_id) => {
            allPolicies.push({
              role_id: role.id,
              scope_id: policy_id,
            })
          })
        })
        return { role_policies: allPolicies }
      }
    )

    createRbacRolePoliciesStep(policiesUpdateData)

    return new WorkflowResponse(updatedRoles)
  }
)
