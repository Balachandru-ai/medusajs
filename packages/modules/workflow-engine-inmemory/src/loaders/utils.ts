import { asClass } from "@medusajs/framework/awilix"
import { InMemoryDistributedTransactionStorage } from "#utils/index"

export default async ({ container }): Promise<void> => {
  container.register({
    inMemoryDistributedTransactionStorage: asClass(
      InMemoryDistributedTransactionStorage
    ).singleton(),
  })
}
