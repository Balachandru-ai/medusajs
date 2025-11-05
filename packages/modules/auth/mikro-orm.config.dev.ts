import AuthIdentity from "./src/models/auth-identity"
import ProviderIdentity from "./src/models/provider-identity"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.AUTH, {
  entities: [AuthIdentity, ProviderIdentity],
})
