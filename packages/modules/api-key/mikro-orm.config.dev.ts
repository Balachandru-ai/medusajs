import ApiKey from "#models/api-key"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.API_KEY, {
  entities: [ApiKey],
})
