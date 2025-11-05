import ApplicationMethod from "#models/application-method"
import CampaignBudgetUsage from "#models/campaign-budget-usage"
import CampaignBudget from "#models/campaign-budget"
import Campaign from "#models/campaign"
import PromotionRuleValue from "#models/promotion-rule-value"
import PromotionRule from "#models/promotion-rule"
import Promotion from "#models/promotion"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.PROMOTION, {
  entities: [
    ApplicationMethod,
    CampaignBudgetUsage,
    CampaignBudget,
    Campaign,
    PromotionRuleValue,
    PromotionRule,
    Promotion,
  ],
})
