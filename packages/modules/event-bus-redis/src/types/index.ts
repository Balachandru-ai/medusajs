// TODO: Comment temporarely and we will re enable it in the near future #14478
// import type { EventBusEventsOptions } from "@medusajs/types"

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { ModuleOptions } from "@medusajs/types"

import {
  BulkJobOptions,
  Job,
  JobsOptions,
  QueueOptions,
  WorkerOptions,
} from "bullmq"
import { RedisOptions } from "ioredis"

export type JobData<T> = {
  eventName: string
  data: T
  completedSubscriberIds?: string[] | undefined
}

export type Options = BulkJobOptions & {
  groupedEventsTTL?: number
  internal?: boolean
}

export type BullJob<T> = {
  data: JobData<T>
  opts: Job["opts"] & Options
} & Job

export type EmitOptions = JobsOptions

export type EventBusRedisModuleOptions = {
  /**
   * Queue name for the event bus
   */
  queueName?: string

  /**
   * Options for BullMQ Queue instance
   * @see https://api.docs.bullmq.io/interfaces/v5.QueueOptions.html
   */
  queueOptions?: Omit<QueueOptions, "connection">

  /**
   * Options for BullMQ Worker instance
   * @see https://api.docs.bullmq.io/interfaces/v5.WorkerOptions.html
   */
  workerOptions?: Omit<WorkerOptions, "connection">

  /**
   * Redis connection string
   */
  redisUrl?: string

  /**
   * Redis client options
   */
  redisOptions?: RedisOptions

  /**
   * Global options passed to all `EventBusService.emit` in the core as well as your own emitters. The options are forwarded to Bull's `Queue.add` method.
   *
   * The global options can be overridden by passing options to `EventBusService.emit` directly.
   *
   * Example
   * ```js
   * {
   *    removeOnComplete: { age: 10 },
   * }
   * ```
   *
   * @see https://api.docs.bullmq.io/interfaces/BaseJobOptions.html
   */
  jobOptions?: EmitOptions

  /**
   * Maximum time in milliseconds to wait for an individual subscriber to finish.
   * If exceeded, the subscriber is treated as failed for this attempt and the job
   * can retry based on `attempts`.
   *
   * Set to `0` or a negative number to disable timeout enforcement.
   *
   * @default 300000 (5 minutes)
   */
  subscriberExecutionTimeout?: number

  // eventOptions?: EventBusEventsOptions
}

declare module "@medusajs/types" {
  interface ModuleOptions {
    "@medusajs/event-bus-redis": EventBusRedisModuleOptions
    "@medusajs/medusa/event-bus-redis": EventBusRedisModuleOptions
  }
}
