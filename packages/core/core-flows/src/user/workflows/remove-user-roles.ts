import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { dismissRemoteLinkStep } from "../../common/steps/dismiss-remote-links"
import { validateUserRolePermissionsStep } from "../steps/validate-user-role-permissions"

export type RemoveUserRolesWorkflowInput = {
  actor_id: string
  actor?: string
  user_id: string
  role_ids: string[]
}

export const removeUserRolesWorkflowId = "remove-user-roles"

/**
 * This workflow removes roles from an existing user.
 */
export const removeUserRolesWorkflow = createWorkflow(
  removeUserRolesWorkflowId,
  (input: WorkflowData<RemoveUserRolesWorkflowInput>) => {
    validateUserRolePermissionsStep({
      actor_id: input.actor_id,
      role_ids: input.role_ids,
      actor: input.actor,
    })

    const userRoleLinks = transform({ input }, ({ input }) => {
      return input.role_ids.map((roleId) => ({
        user: { user_id: input.user_id },
        rbac: { rbac_role_id: roleId },
      }))
    })

    dismissRemoteLinkStep(userRoleLinks)

    return new WorkflowResponse(void 0)
  }
)
