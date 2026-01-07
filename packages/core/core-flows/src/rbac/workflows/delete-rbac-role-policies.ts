import { WorkflowData, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { deleteRbacRolePoliciesStep } from "../steps"

export type DeleteRbacRolePoliciesWorkflowInput = {
  ids: string[]
}

export const deleteRbacRolePoliciesWorkflowId = "delete-rbac-role-policies"

export const deleteRbacRolePoliciesWorkflow = createWorkflow(
  deleteRbacRolePoliciesWorkflowId,
  (
    input: WorkflowData<DeleteRbacRolePoliciesWorkflowInput>
  ): WorkflowData<void> => {
    deleteRbacRolePoliciesStep(input.ids)
  }
)
