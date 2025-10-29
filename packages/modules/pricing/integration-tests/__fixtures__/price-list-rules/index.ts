import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import PriceListRule from "#models/price-list-rule"
import { toMikroORMEntity } from "@medusajs/framework/utils"
import { defaultPriceListRuleData } from "./data"
import { InferEntityType } from "@medusajs/framework/types"

export * from "./data"

export async function createPriceListRules(
  manager: SqlEntityManager,
  priceListRuleData: any[] = defaultPriceListRuleData
): Promise<InferEntityType<typeof PriceListRule>[]> {
  const priceListRules: InferEntityType<typeof PriceListRule>[] = []

  for (let data of priceListRuleData) {
    const plr = manager.create(toMikroORMEntity(PriceListRule), data)

    priceListRules.push(plr)
  }

  await manager.persistAndFlush(priceListRules)

  return priceListRules
}
