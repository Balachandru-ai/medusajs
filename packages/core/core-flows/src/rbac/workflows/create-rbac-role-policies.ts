import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { createRbacRolePoliciesStep } from "../steps"

export type CreateRbacRolePoliciesWorkflowInput = {
  role_policies: any[]
}

export const createRbacRolePoliciesWorkflowId = "create-rbac-role-policies"

export const createRbacRolePoliciesWorkflow = createWorkflow(
  createRbacRolePoliciesWorkflowId,
  (input: WorkflowData<CreateRbacRolePoliciesWorkflowInput>) => {
    return new WorkflowResponse(createRbacRolePoliciesStep(input))
  }
)
