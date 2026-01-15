import { Modules } from "@medusajs/framework/utils"
import { ProviderLoaderOptions } from "@medusajs/framework/types"
import { asValue } from "@medusajs/framework/awilix"
import Redis from "ioredis"
import { EOL } from "os"
import { EventRedisProviderOptions } from "@types"

export default async ({
  container,
  logger,
  options,
}: ProviderLoaderOptions): Promise<void> => {
  const {
    redisUrl,
    redisOptions,
    queueName,
    queueOptions,
    workerOptions,
    jobOptions,
  } = options as EventRedisProviderOptions

  if (!redisUrl) {
    throw Error(
      `[event-redis] No "redisUrl" provided in "${Modules.EVENT_BUS}" module, "event-redis" provider options. It is required for the "event-redis" provider.`
    )
  }

  const connection = new Redis(redisUrl, {
    // Required config. See: https://github.com/OptimalBits/bull/blob/develop/CHANGELOG.md#breaking-changes
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Lazy connect to properly handle connection errors
    lazyConnect: true,
    ...(redisOptions ?? {}),
  })

  try {
    await new Promise(async (resolve) => {
      await connection.connect(resolve)
    })
    logger?.info(
      `[event-redis] Connection to Redis in "event-redis" provider established`
    )
  } catch (err) {
    logger?.error(
      `[event-redis] An error occurred while connecting to Redis in provider "event-redis":${EOL} ${err}`
    )
  }

  container.register({
    eventRedisConnection: asValue(connection),
    eventRedisQueueName: asValue(queueName ?? "events-queue"),
    eventRedisQueueOptions: asValue(queueOptions ?? {}),
    eventRedisWorkerOptions: asValue(workerOptions ?? {}),
    eventRedisJobOptions: asValue(jobOptions ?? {}),
  })
}
