import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { createRbacRolesStep } from "../steps"

export type CreateRbacRolesWorkflowInput = {
  roles: any[]
}

export const createRbacRolesWorkflowId = "create-rbac-roles"

export const createRbacRolesWorkflow = createWorkflow(
  createRbacRolesWorkflowId,
  (input: WorkflowData<CreateRbacRolesWorkflowInput>) => {
    return new WorkflowResponse(createRbacRolesStep(input))
  }
)
