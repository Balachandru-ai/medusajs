import { deleteRbacPoliciesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { defineFileConfig, FeatureFlag } from "@medusajs/framework/utils"
import RbacFeatureFlag from "../../../../../../../feature-flags/rbac"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { policy_id } = req.params

  await deleteRbacPoliciesWorkflow(req.scope).run({
    input: { ids: [policy_id] },
  })

  res.status(200).json({
    id: policy_id,
    object: "rbac_policy",
    deleted: true,
  })
}

defineFileConfig({
  isDisabled: () => !FeatureFlag.isFeatureEnabled(RbacFeatureFlag.key),
})
