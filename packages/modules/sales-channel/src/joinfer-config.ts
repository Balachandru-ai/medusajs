import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import { default as schema } from "#schema/index"

export const joinerConfig = defineJoinerConfig(Modules.SALES_CHANNEL, {
  schema,
})
