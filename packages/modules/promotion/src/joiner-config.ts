import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import Campaign from "#models/campaign"
import Promotion from "#models/promotion"
import PromotionRule from "#models/promotion-rule"
import { default as schema } from "#schema/index"

export const joinerConfig = defineJoinerConfig(Modules.PROMOTION, {
  schema,
  models: [Promotion, Campaign, PromotionRule],
})
