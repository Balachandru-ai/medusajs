import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "../../common/steps/create-remote-links"
import { validateRolesExistStep } from "../../invite/steps/validate-roles-exist"
import { validateUserRolePermissionsStep } from "../steps/validate-user-role-permissions"

export type AssignUserRolesWorkflowInput = {
  actor_id: string
  actor?: string
  user_id: string
  role_ids: string[]
}

export const assignUserRolesWorkflowId = "assign-user-roles"

/**
 * This workflow assigns roles to an existing user.
 * It validates that the actor has all the policies from the roles being assigned.
 */
export const assignUserRolesWorkflow = createWorkflow(
  assignUserRolesWorkflowId,
  (input: WorkflowData<AssignUserRolesWorkflowInput>) => {
    validateRolesExistStep(input.role_ids)

    validateUserRolePermissionsStep({
      actor_id: input.actor_id,
      actor: input.actor,
      role_ids: input.role_ids,
    })

    const userRoleLinks = transform({ input }, ({ input }) => {
      return input.role_ids.map((roleId) => ({
        user: { user_id: input.user_id },
        rbac: { rbac_role_id: roleId },
      }))
    })

    createRemoteLinkStep(userRoleLinks)

    return new WorkflowResponse(void 0)
  }
)
