import { Invite } from "#models/invite"
import { User } from "#models/user"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.USER, {
  entities: [Invite, User],
})
