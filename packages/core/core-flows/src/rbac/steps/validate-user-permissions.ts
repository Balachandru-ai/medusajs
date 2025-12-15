import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type ValidateUserPermissionsStepInput = {
  user_id: string
  policy_ids: string[]
}

export const validateUserPermissionsStepId = "validate-user-permissions"

/**
 * Validates that a user has access to all the policies they are trying to assign.
 * A user can only create roles and add policies that they themselves have access to.
 */
export const validateUserPermissionsStep = createStep(
  validateUserPermissionsStepId,
  async (data: ValidateUserPermissionsStepInput, { container }) => {
    const { user_id, policy_ids } = data

    if (!policy_ids?.length) {
      return new StepResponse({ validated: true })
    }

    const query = container.resolve("query")
    const { data: users } = await query.graph({
      entity: "user",
      fields: ["rbac_roles.id", "rbac_roles.policies.*"],
      filters: { id: user_id },
    })

    if (!users?.[0]?.rbac_roles || users[0].rbac_roles.length === 0) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        `User does not have any roles assigned and cannot create roles or assign policies`
      )
    }

    const allUserPolicies = users[0].rbac_roles.flatMap(
      (role) => role.policies || []
    )
    const userPolicyIds = new Set(allUserPolicies.map((p) => p.id))

    const unauthorizedPolicies = policy_ids.filter(
      (policyId) => !userPolicyIds.has(policyId)
    )

    if (unauthorizedPolicies.length) {
      const policyMap = new Map(
        allUserPolicies.map((p) => [p.id, p.name || p.key])
      )

      const unauthorizedNames = unauthorizedPolicies
        .map((id) => policyMap.get(id) || id)
        .join(", ")

      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        `User does not have access to the following policies and cannot assign them: ${unauthorizedNames}`
      )
    }

    return new StepResponse({
      validated: true,
      user_policy_count: userPolicyIds.size,
    })
  }
)
