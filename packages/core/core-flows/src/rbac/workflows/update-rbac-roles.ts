import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { UpdateRbacRoleDTO } from "@medusajs/types"
import { updateRbacRolesStep } from "../steps/update-rbac-roles"

export type UpdateRbacRolesWorkflowInput = {
  selector: Record<string, any>
  update: Omit<UpdateRbacRoleDTO, "id">
}

export const updateRbacRolesWorkflowId = "update-rbac-roles"

export const updateRbacRolesWorkflow = createWorkflow(
  updateRbacRolesWorkflowId,
  (input: WorkflowData<UpdateRbacRolesWorkflowInput>) => {
    return new WorkflowResponse(updateRbacRolesStep(input))
  }
)
