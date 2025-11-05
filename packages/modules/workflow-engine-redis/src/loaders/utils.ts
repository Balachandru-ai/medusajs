import { asClass, asValue } from "@medusajs/framework/awilix"
import { RedisDistributedTransactionStorage } from "#utils/index"

export default async ({ container, dataLoaderOnly }): Promise<void> => {
  container.register({
    redisDistributedTransactionStorage: asClass(
      RedisDistributedTransactionStorage
    ).singleton(),
    dataLoaderOnly: asValue(!!dataLoaderOnly),
  })
}
