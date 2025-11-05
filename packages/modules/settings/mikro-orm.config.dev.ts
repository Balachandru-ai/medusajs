import { UserPreference } from "#models/user-preference"
import { ViewConfiguration } from "#models/view-configuration"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.SETTINGS, {
  entities: [UserPreference, ViewConfiguration],
})
