import {
  InternalModuleDeclaration,
  LoaderOptions,
} from "@medusajs/framework/types"
import { asValue } from "@medusajs/framework/awilix"
import Redis from "ioredis"
import { RedisWorkflowsOptions } from "../types"

export default async (
  { container, logger, options, dataLoaderOnly }: LoaderOptions,
  moduleDeclaration: InternalModuleDeclaration
): Promise<void> => {
  const {
    url,
    options: redisOptions,
    jobQueueName,
    queueName,
    pubsub,
  } = options?.redis as RedisWorkflowsOptions

  // TODO: get default from ENV VAR
  if (!url) {
    throw Error(
      "No `redis.url` provided in `workflowOrchestrator` module options. It is required for the Workflow Orchestrator Redis."
    )
  }

  const cnnPubSub = pubsub ?? { url, options: redisOptions }

  const queueName_ = queueName ?? "medusa-workflows"
  const jobQueueName_ = jobQueueName ?? "medusa-workflows-jobs"

  let connection!: Awaited<ReturnType<typeof getConnection>>
  let redisPublisher!: Awaited<ReturnType<typeof getConnection>>
  let redisSubscriber!: Awaited<ReturnType<typeof getConnection>>
  let workerConnection!: Awaited<ReturnType<typeof getConnection>>

  try {
    connection = await getConnection(url, redisOptions)
    workerConnection = await getConnection(url, {
      ...(redisOptions ?? {}),
      maxRetriesPerRequest: null,
    })
    logger?.info(
      `[Workflow-engine-redis] Connection to Redis in module 'workflow-engine-redis' established`
    )
  } catch (err) {
    logger?.error(
      `[Workflow-engine-redis] An error occurred while connecting to Redis in module 'workflow-engine-redis': ${err}`
    )
  }

  try {
    redisPublisher = await getConnection(cnnPubSub.url, cnnPubSub.options)
    redisSubscriber = await getConnection(cnnPubSub.url, cnnPubSub.options)
    logger?.info(
      `[Workflow-engine-redis] Connection to Redis PubSub in module 'workflow-engine-redis' established`
    )
  } catch (err) {
    logger?.error(
      `[Workflow-engine-redis] An error occurred while connecting to Redis PubSub in module 'workflow-engine-redis': ${err}`
    )
  }

  container.register({
    isWorkerMode: asValue(moduleDeclaration.worker_mode !== "server"),
    partialLoading: asValue(true),
    redisConnection: asValue(connection),
    redisWorkerConnection: asValue(workerConnection),
    redisPublisher: asValue(redisPublisher),
    redisSubscriber: asValue(redisSubscriber),
    redisQueueName: asValue(queueName_),
    redisJobQueueName: asValue(jobQueueName_),
    redisDisconnectHandler: asValue(async () => {
      // Use quit() for graceful shutdown instead of disconnect()
      // quit() waits for pending commands to complete
      const disconnectPromises: Promise<any>[] = []

      if (connection && connection.status !== "end") {
        disconnectPromises.push(
          connection.quit().catch(() => connection.disconnect())
        )
      }

      if (workerConnection && workerConnection.status !== "end") {
        disconnectPromises.push(
          workerConnection.quit().catch(() => workerConnection.disconnect())
        )
      }

      if (redisPublisher && redisPublisher.status !== "end") {
        disconnectPromises.push(
          redisPublisher.quit().catch(() => redisPublisher.disconnect())
        )
      }

      if (redisSubscriber && redisSubscriber.status !== "end") {
        disconnectPromises.push(
          redisSubscriber.quit().catch(() => redisSubscriber.disconnect())
        )
      }

      await Promise.all(disconnectPromises)
    }),
  })
}

async function getConnection(url: string, redisOptions?: any) {
  const connection = new Redis(url, {
    lazyConnect: true,
    // Add retry strategy to handle temporary connection issues
    retryStrategy: (times: number) => {
      if (times > 3) {
        return null // Stop retrying after 3 attempts
      }
      // Exponential backoff: 50ms, 100ms, 200ms
      return Math.min(times * 50, 200)
    },
    // Ensure connections don't timeout too quickly
    connectTimeout: 10000,
    // Keep connections alive
    enableReadyCheck: true,
    ...(redisOptions ?? {}),
  })

  // Add error handler to prevent unhandled errors from crashing the process
  connection.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message)
  })

  await new Promise<void>(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Redis connection timeout after 10 seconds"))
    }, 10000)

    try {
      await connection.connect()
      clearTimeout(timeout)
      resolve()
    } catch (error) {
      clearTimeout(timeout)
      reject(error)
    }
  })

  return connection
}
