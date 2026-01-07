import { model } from "@medusajs/framework/utils"
import RbacPolicy from "./rbac-policy"
import RbacRole from "./rbac-role"

const RbacRolePolicy = model
  .define("rbac_role_policy", {
    id: model.id({ prefix: "rlpl" }).primaryKey(),
    role: model.belongsTo(() => RbacRole),
    scope: model.belongsTo(() => RbacPolicy),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["role_id"],
      where: "deleted_at IS NULL",
    },
    {
      on: ["scope_id"],
      where: "deleted_at IS NULL",
    },
    {
      on: ["role_id", "scope_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default RbacRolePolicy
