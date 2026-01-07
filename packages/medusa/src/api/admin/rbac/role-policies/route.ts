import { createRbacRolePoliciesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdminCreateRbacRolePolicyType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: role_policies, metadata } = await query.graph({
    entity: "rbac_role_policy",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.status(200).json({
    role_policies,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateRbacRolePolicyType>,
  res: MedusaResponse
) => {
  const input = [req.validatedBody]

  const { result } = await createRbacRolePoliciesWorkflow(req.scope).run({
    input: { role_policies: input },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: rolePolicies } = await query.graph({
    entity: "rbac_role_policy",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  const role_policy = rolePolicies[0]

  res.status(200).json({ role_policy })
}
