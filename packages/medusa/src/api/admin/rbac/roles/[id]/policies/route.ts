import { createRbacRolePoliciesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  defineFileConfig,
  FeatureFlag,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import RbacFeatureFlag from "../../../../../../feature-flags/rbac"
import { listTransformQueryConfig } from "../../query-config"
import { AdminAddRolePoliciesType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const roleId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: role_policies, metadata } = await query.graph({
    entity: "rbac_role_policy",
    fields: req.queryConfig?.fields,
    filters: { ...req.filterableFields, role_id: roleId },
    pagination: req.queryConfig?.pagination || {},
  })

  res.status(200).json({
    role_policies,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminAddRolePoliciesType>,
  res: MedusaResponse
) => {
  const roleId = req.params.id
  const { policies } = req.validatedBody
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

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

  // Get the created role-policy association
  const { data: role_policies } = await query.graph({
    entity: "rbac_role_policy",
    fields: req.queryConfig?.fields || listTransformQueryConfig.defaults,
    filters: { id: result[0].id },
  })

  res.status(200).json({ role_policies })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const roleId = req.params.id
  const policyId = req.params.policyId

  if (!policyId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `policyId is required in the URL parameters`
    )
  }

  const rbacService = req.scope.resolve(Modules.RBAC)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: rolePolicies } = await query.graph({
    entity: "rbac_role_policy",
    fields: ["id"],
    filters: {
      role_id: roleId,
      policy_id: policyId,
    },
    pagination: { take: 1 },
  })

  const rolePolicy = rolePolicies?.[0]

  if (!rolePolicy) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Policy with id ${policyId} is not associated with role ${roleId}`
    )
  }

  await rbacService.deleteRbacRolePolicies([rolePolicy.id])

  res.status(200).json({
    id: rolePolicy.id,
    object: "rbac_role_policy",
    deleted: true,
  })
}

defineFileConfig({
  isDisabled: () => !FeatureFlag.isFeatureEnabled(RbacFeatureFlag.key),
})
