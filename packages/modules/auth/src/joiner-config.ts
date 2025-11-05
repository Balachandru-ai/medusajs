import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import { AuthIdentity } from "#models/auth-identity"
import { ProviderIdentity } from "#models/provider-identity"

export const joinerConfig = defineJoinerConfig(Modules.AUTH, {
  models: [AuthIdentity, ProviderIdentity],
})
