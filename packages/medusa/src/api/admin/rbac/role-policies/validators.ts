import { z } from "zod"
import { applyAndAndOrOperators } from "../../../utils/common-validators"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "../../../utils/validators"

export type AdminGetRbacRolePolicyParamsType = z.infer<
  typeof AdminGetRbacRolePolicyParams
>
export const AdminGetRbacRolePolicyParams = createSelectParams()

export const AdminGetRbacRolePoliciesParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  role_id: z.union([z.string(), z.array(z.string())]).optional(),
  scope_id: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
})

export type AdminGetRbacRolePoliciesParamsType = z.infer<
  typeof AdminGetRbacRolePoliciesParams
>
export const AdminGetRbacRolePoliciesParams = createFindParams({
  limit: 50,
  offset: 0,
})
  .merge(AdminGetRbacRolePoliciesParamsFields)
  .merge(applyAndAndOrOperators(AdminGetRbacRolePoliciesParamsFields))

export type AdminCreateRbacRolePolicyType = z.infer<
  typeof AdminCreateRbacRolePolicy
>
export const AdminCreateRbacRolePolicy = z
  .object({
    role_id: z.string(),
    scope_id: z.string(),
    metadata: z.record(z.unknown()).nullish(),
  })
  .strict()

export type AdminUpdateRbacRolePolicyType = z.infer<
  typeof AdminUpdateRbacRolePolicy
>
export const AdminUpdateRbacRolePolicy = z
  .object({
    metadata: z.record(z.unknown()).nullish(),
  })
  .strict()
