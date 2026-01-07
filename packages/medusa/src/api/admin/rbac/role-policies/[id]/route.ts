import {
  deleteRbacRolePoliciesWorkflow,
  updateRbacRolePoliciesWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { AdminUpdateRbacRolePolicyType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: rolePolicies } = await query.graph({
    entity: "rbac_role_policy",
    filters: { id: req.params.id },
    fields: req.queryConfig.fields,
  })

  const role_policy = rolePolicies[0]

  if (!role_policy) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Role policy with id: ${req.params.id} not found`
    )
  }

  res.status(200).json({ role_policy })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateRbacRolePolicyType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: existing } = await query.graph({
    entity: "rbac_role_policy",
    filters: { id: req.params.id },
    fields: ["id"],
  })

  const existingRolePolicy = existing[0]
  if (!existingRolePolicy) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Role policy with id "${req.params.id}" not found`
    )
  }

  const { result } = await updateRbacRolePoliciesWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update: req.validatedBody,
    },
  })

  const { data: rolePolicies } = await query.graph({
    entity: "rbac_role_policy",
    filters: { id: result[0].id },
    fields: req.queryConfig.fields,
  })

  const role_policy = rolePolicies[0]

  res.status(200).json({ role_policy })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const id = req.params.id

  await deleteRbacRolePoliciesWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "rbac_role_policy",
    deleted: true,
  })
}
