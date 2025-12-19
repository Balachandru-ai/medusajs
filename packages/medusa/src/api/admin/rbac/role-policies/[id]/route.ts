import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  defineFileConfig,
  FeatureFlag,
  Modules,
} from "@medusajs/framework/utils"
import { IRbacModuleService } from "@medusajs/types"
import RbacFeatureFlag from "../../../../../feature-flags/rbac"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const rbacService = req.scope.resolve<IRbacModuleService>(Modules.RBAC)
  const { id } = req.params

  await rbacService.deleteRbacRolePolicies([id])

  res.status(200).json({
    id,
    object: "rbac_role_policy",
    deleted: true,
  })
}

defineFileConfig({
  isDisabled: () => !FeatureFlag.isFeatureEnabled(RbacFeatureFlag.key),
})
