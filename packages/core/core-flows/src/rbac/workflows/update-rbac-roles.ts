import { isDefined } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { UpdateRbacRoleDTO } from "@medusajs/types"
import { createRbacRolePoliciesStep, setRoleInheritanceStep } from "../steps"
import { updateRbacRolesStep } from "../steps/update-rbac-roles"
import { validateUserPermissionsStep } from "../steps/validate-user-permissions"

export type UpdateRbacRolesWorkflowInput = {
  user_id?: string
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
    const validationData = transform({ input }, ({ input }) => {
      const policyIds = input.update.policy_ids || []
      return {
        user_id: input.user_id!,
        policy_ids: policyIds,
      }
    })

    when({ validationData }, ({ validationData }) => {
      return !!validationData?.user_id && !!validationData?.policy_ids?.length
    }).then(() => {
      validateUserPermissionsStep(validationData)
    })

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
