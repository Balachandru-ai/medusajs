import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"
import IndexData from "#models/index-data"
import IndexMetadata from "#models/index-metadata"
import IndexRelation from "#models/index-relation"
import IndexSync from "#models/index-sync"

export default defineMikroOrmCliConfig(Modules.INDEX, {
  entities: [IndexData, IndexMetadata, IndexRelation, IndexSync],
})
