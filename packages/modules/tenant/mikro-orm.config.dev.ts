import * as entities from "./src/models"
import { defineMikroOrmCliConfig } from "@medusajs/framework/utils"
import { TENANT_MODULE } from "./src/joiner-config"

export default defineMikroOrmCliConfig(TENANT_MODULE, {
  entities: Object.values(entities),
})
