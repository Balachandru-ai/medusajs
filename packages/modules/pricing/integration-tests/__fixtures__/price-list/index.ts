import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import PriceList from "#models/price-list"
import { toMikroORMEntity } from "@medusajs/framework/utils"
import { defaultPriceListData } from "./data"
import { InferEntityType } from "@medusajs/framework/types"

export * from "./data"

export async function createPriceLists(
  manager: SqlEntityManager,
  priceListData: any[] = defaultPriceListData
): Promise<InferEntityType<typeof PriceList>[]> {
  const priceLists: InferEntityType<typeof PriceList>[] = []

  for (let data of priceListData) {
    const pl = manager.create(toMikroORMEntity(PriceList), data)

    priceLists.push(pl)
  }

  await manager.persistAndFlush(priceLists)

  return priceLists
}
