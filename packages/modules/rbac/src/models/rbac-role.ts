import { model } from "@medusajs/framework/utils"

const RbacRole = model
  .define("rbac_role", {
    id: model.id({ prefix: "role" }).primaryKey(),
    name: model.text().searchable(),
    parent: model.belongsTo(() => RbacRole).nullable(),
    description: model.text().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["name"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["parent_id"],
      where: "deleted_at IS NULL",
    },
  ])

export default RbacRole
