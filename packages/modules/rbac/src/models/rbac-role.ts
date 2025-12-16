import { model } from "@medusajs/framework/utils"
import RbacRoleInheritance from "./rbac-role-inheritance"
import RbacRolePolicy from "./rbac-role-policy"

const RbacRole = model
  .define("rbac_role", {
    id: model.id({ prefix: "role" }).primaryKey(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    metadata: model.json().nullable(),
    policies: model.hasMany(() => RbacRolePolicy, {
      mappedBy: "role",
    }),
    inheritances: model.hasMany(() => RbacRoleInheritance, {
      mappedBy: "role",
    }),
  })
  .indexes([
    {
      on: ["name"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default RbacRole
