import { CreatePriceSetDTO, InferEntityType } from "@medusajs/framework/types"
import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import Price from "#models/price"
import PriceSet from "#models/price-set"
import { toMikroORMEntity } from "@medusajs/framework/utils"
import { defaultPriceSetsData } from "./data"

export * from "./data"

export async function createPriceSets(
  manager: SqlEntityManager,
  priceSetsData: CreatePriceSetDTO[] = defaultPriceSetsData
): Promise<InferEntityType<typeof PriceSet>[]> {
  const priceSets: InferEntityType<typeof PriceSet>[] = []

  for (let priceSetData of priceSetsData) {
    const priceSetDataClone = { ...priceSetData }
    const prices = priceSetDataClone.prices || []
    delete priceSetDataClone.prices

    let priceSet = manager.create(
      toMikroORMEntity(PriceSet),
      priceSetDataClone
    ) as InferEntityType<typeof PriceSet>

    manager.persist(priceSet)

    for (let priceData of prices) {
      const price = manager.create(toMikroORMEntity(Price), {
        ...priceData,
        price_set_id: priceSet.id,
        title: "test",
      })

      manager.persist(price)
    }

    await manager.flush()
  }

  return priceSets
}
