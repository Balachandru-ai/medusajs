import Price from "#models/price"
import { defaultPricesData } from "./data"
import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import { toMikroORMEntity } from "@medusajs/framework/utils"
import { InferEntityType } from "@medusajs/framework/types"

export * from "./data"

export async function createPrices(
  manager: SqlEntityManager,
  pricesData: any[] = defaultPricesData
): Promise<InferEntityType<typeof Price>[]> {
  const prices: InferEntityType<typeof Price>[] = []

  for (let data of pricesData) {
    const price = manager.create(toMikroORMEntity(Price), data)
    prices.push(price)
  }

  await manager.persistAndFlush(prices)

  return prices
}
