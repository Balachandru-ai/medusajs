import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import {
  createRbacRoleInheritancesStep,
  createRbacRolePoliciesStep,
  createRbacRolesStep,
} from "../steps"
import { validateUserPermissionsStep } from "../steps/validate-user-permissions"

export type CreateRbacRolesWorkflowInput = {
  user_id?: string
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
    const validationData = transform({ input }, ({ input }) => {
      const allPolicyIds = new Set<string>()
      input.roles.forEach((role) => {
        role.policy_ids?.forEach((policyId) => allPolicyIds.add(policyId))
      })
      return {
        user_id: input.user_id!,
        policy_ids: Array.from(allPolicyIds),
      }
    })

    when({ validationData }, ({ validationData }) => {
      return !!validationData?.user_id && !!validationData?.policy_ids?.length
    }).then(() => {
      validateUserPermissionsStep(validationData)
    })

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
