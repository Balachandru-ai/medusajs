import { createRbacRolePoliciesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"

const AdminAddRolePoliciesType = z.object({
  policies: z.array(z.string()).min(1, "At least one policy ID is required"),
})

type AdminAddRolePoliciesType = z.infer<typeof AdminAddRolePoliciesType>

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminAddRolePoliciesType>,
  res: MedusaResponse
) => {
  const roleId = req.params.id
  const { policies } = req.validatedBody

  const rolePolicies = policies.map((policyId) => ({
    role_id: roleId,
    policy_id: policyId,
  }))

  const { result } = await createRbacRolePoliciesWorkflow(req.scope).run({
    input: {
      actor_id: req.auth_context.actor_id,
      actor: req.auth_context.actor_type,
      role_policies: rolePolicies,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const rolePoliciesResult = await Promise.all(
    result.map(async (rp) => {
      const { data } = await query.graph({
        entity: "rbac_role_policy",
        fields: req.queryConfig?.fields || ["*"],
        filters: { id: rp.id },
      })
      return data[0]
    })
  )

  res.status(200).json({
    role_policies: rolePoliciesResult,
  })
}
