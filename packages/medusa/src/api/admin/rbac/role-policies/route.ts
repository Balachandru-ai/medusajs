import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  defineFileConfig,
  FeatureFlag,
  Modules,
} from "@medusajs/framework/utils"
import { IRbacModuleService } from "@medusajs/types"
import RbacFeatureFlag from "../../../../feature-flags/rbac"
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
  const rbacService = req.scope.resolve<IRbacModuleService>(Modules.RBAC)

  const role_policy = await rbacService.createRbacRolePolicies([
    req.validatedBody,
  ])

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: role_policies } = await query.graph({
    entity: "rbac_role_policy",
    fields: req.queryConfig.fields,
    filters: { id: role_policy[0].id },
  })

  res.status(200).json({ role_policy: role_policies[0] })
}

defineFileConfig({
  isDisabled: () => !FeatureFlag.isFeatureEnabled(RbacFeatureFlag.key),
})
