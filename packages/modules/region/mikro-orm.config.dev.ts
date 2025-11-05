import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"
import Country from "#models/country"
import Region from "#models/region"

export default defineMikroOrmCliConfig(Modules.REGION, {
  entities: [Country, Region],
})
