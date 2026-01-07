import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  createRbacRoleInheritancesStep,
  createRbacRolePoliciesStep,
  createRbacRolesStep,
} from "../steps"

export type CreateRbacRolesWorkflowInput = {
  roles: {
    name: string
    description?: string | null
    metadata?: Record<string, unknown> | null
    inherited_role_ids?: string[]
    policy_ids?: string[]
  }[]
}

export const createRbacRolesWorkflowId = "create-rbac-roles"

export const createRbacRolesWorkflow = createWorkflow(
  createRbacRolesWorkflowId,
  (input: WorkflowData<CreateRbacRolesWorkflowInput>) => {
    const roleData = transform({ input }, ({ input }) => ({
      roles: input.roles.map((r) => ({
        name: r.name,
        description: r.description,
        metadata: r.metadata,
      })),
    }))

    const createdRoles = createRbacRolesStep(roleData)

    const inheritanceData = transform(
      { input, createdRoles },
      ({ input, createdRoles }) => {
        const inheritances: any[] = []

        createdRoles.forEach((role, index) => {
          const inheritedRoleIds = input.roles[index].inherited_role_ids || []
          inheritedRoleIds.forEach((inheritedRoleId) => {
            inheritances.push({
              role_id: role.id,
              inherited_role_id: inheritedRoleId,
            })
          })
        })

        return { role_inheritances: inheritances }
      }
    )

    const policiesData = transform(
      { input, createdRoles },
      ({ input, createdRoles }) => {
        const allPolicies: any[] = []
        createdRoles.forEach((role, index) => {
          const policyIds = input.roles[index].policy_ids || []
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

    createRbacRoleInheritancesStep(inheritanceData)

    createRbacRolePoliciesStep(policiesData)

    return new WorkflowResponse(createdRoles)
  }
)
