import { createRbacRolesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdminCreateRbacRoleType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: roles, metadata } = await query.graph({
    entity: "rbac_role",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.status(200).json({
    roles,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateRbacRoleType>,
  res: MedusaResponse
) => {
  const input = [req.validatedBody]

  const { result } = await createRbacRolesWorkflow(req.scope).run({
    input: { roles: input },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: roles } = await query.graph({
    entity: "rbac_role",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  const role = roles[0]

  res.status(200).json({ role })
}
