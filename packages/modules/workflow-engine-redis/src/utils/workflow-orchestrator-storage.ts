import {
  DistributedTransactionType,
  IDistributedSchedulerStorage,
  IDistributedTransactionStorage,
  SchedulerOptions,
  SkipExecutionError,
  TransactionCheckpoint,
  TransactionContext,
  TransactionFlow,
  TransactionOptions,
  TransactionStep,
  TransactionStepError,
} from "@medusajs/framework/orchestration"
import { Logger, ModulesSdkTypes } from "@medusajs/framework/types"
import {
  MedusaError,
  promiseAll,
  TransactionState,
  TransactionStepState,
} from "@medusajs/framework/utils"
import { raw } from "@mikro-orm/core"
import { WorkflowOrchestratorService } from "@services"
import { Queue, RepeatOptions, Worker } from "bullmq"
import Redis from "ioredis"

enum JobType {
  SCHEDULE = "schedule",
  RETRY = "retry",
  STEP_TIMEOUT = "step_timeout",
  TRANSACTION_TIMEOUT = "transaction_timeout",
}

const ONE_HOUR_IN_MS = 1000 * 60 * 60
const REPEATABLE_CLEARER_JOB_ID = "clear-expired-executions"

export class RedisDistributedTransactionStorage
  implements IDistributedTransactionStorage, IDistributedSchedulerStorage
{
  private workflowExecutionService_: ModulesSdkTypes.IMedusaInternalService<any>
  private logger_: Logger
  private workflowOrchestratorService_: WorkflowOrchestratorService

  private redisClient: Redis
  private redisWorkerConnection: Redis
  private queueName: string
  private jobQueueName: string
  private queue: Queue
  private jobQueue?: Queue
  private worker: Worker
  private jobWorker?: Worker
  private cleanerQueueName: string
  private cleanerWorker_: Worker
  private cleanerQueue_?: Queue

  #isWorkerMode: boolean = false
  private static readonly EXECUTION_LOCK_PREFIX = "workflow_engine:exec_lock:"
  private static readonly EXECUTION_LOCK_TTL = 60 // 1 minute in seconds
  private static readonly HEARTBEAT_INTERVAL = 30000 // 30 seconds in milliseconds
  private activeLocks = new Set<string>()
  private heartbeatTimer?: NodeJS.Timeout

  constructor({
    workflowExecutionService,
    redisConnection,
    redisWorkerConnection,
    redisQueueName,
    redisJobQueueName,
    logger,
    isWorkerMode,
  }: {
    workflowExecutionService: ModulesSdkTypes.IMedusaInternalService<any>
    redisConnection: Redis
    redisWorkerConnection: Redis
    redisQueueName: string
    redisJobQueueName: string
    logger: Logger
    isWorkerMode: boolean
  }) {
    this.workflowExecutionService_ = workflowExecutionService
    this.logger_ = logger
    this.redisClient = redisConnection
    this.redisWorkerConnection = redisWorkerConnection
    this.cleanerQueueName = "workflows-cleaner"
    this.queueName = redisQueueName
    this.jobQueueName = redisJobQueueName
    this.queue = new Queue(redisQueueName, { connection: this.redisClient })
    this.jobQueue = isWorkerMode
      ? new Queue(redisJobQueueName, {
          connection: this.redisClient,
        })
      : undefined
    this.cleanerQueue_ = isWorkerMode
      ? new Queue(this.cleanerQueueName, {
          connection: this.redisClient,
        })
      : undefined
    this.#isWorkerMode = isWorkerMode
  }

  async onApplicationPrepareShutdown() {
    this.stopHeartbeat()
    // Close worker gracefully, i.e. wait for the current jobs to finish
    await this.worker?.close()
    await this.jobWorker?.close()

    const repeatableJobs = (await this.cleanerQueue_?.getRepeatableJobs()) ?? []
    for (const job of repeatableJobs) {
      if (job.id === REPEATABLE_CLEARER_JOB_ID) {
        await this.cleanerQueue_?.removeRepeatableByKey(job.key)
      }
    }

    await this.cleanerWorker_?.close()
  }

  async onApplicationShutdown() {
    await this.queue?.close()
    await this.jobQueue?.close()
    await this.cleanerQueue_?.close()
  }

  async onApplicationStart() {
    this.startHeartbeat()
    const allowedJobs = [
      JobType.RETRY,
      JobType.STEP_TIMEOUT,
      JobType.TRANSACTION_TIMEOUT,
    ]

    const workerOptions = {
      connection: this.redisWorkerConnection,
    }

    // TODO: Remove this once we have released to all clients (Added: v2.6+)
    // Remove all repeatable jobs from the old queue since now we have a queue dedicated to scheduled jobs
    await this.removeAllRepeatableJobs(this.queue)

    this.worker = new Worker(
      this.queueName,
      async (job) => {
        this.logger_.debug(
          `executing job ${job.name} from queue ${
            this.queueName
          } with the following data: ${JSON.stringify(job.data)}`
        )
        if (allowedJobs.includes(job.name as JobType)) {
          await this.executeTransaction(
            job.data.workflowId,
            job.data.transactionId,
            job.data.transactionMetadata
          )
        }

        if (job.name === JobType.SCHEDULE) {
          // Remove repeatable job from the old queue since now we have a queue dedicated to scheduled jobs
          await this.remove(job.data.jobId)
        }
      },
      workerOptions
    )

    if (this.#isWorkerMode) {
      this.jobWorker = new Worker(
        this.jobQueueName,
        async (job) => {
          this.logger_.debug(
            `executing scheduled job ${job.data.jobId} from queue ${
              this.jobQueueName
            } with the following options: ${JSON.stringify(
              job.data.schedulerOptions
            )}`
          )
          return await this.executeScheduledJob(
            job.data.jobId,
            job.data.schedulerOptions
          )
        },
        workerOptions
      )

      this.cleanerWorker_ = new Worker(
        this.cleanerQueueName,
        async () => {
          await this.clearExpiredExecutions()
        },
        { connection: this.redisClient }
      )

      await this.cleanerQueue_?.add(
        "cleaner",
        {},
        {
          repeat: {
            every: ONE_HOUR_IN_MS,
          },
          jobId: REPEATABLE_CLEARER_JOB_ID,
          removeOnComplete: true,
          removeOnFail: true,
        }
      )
    }
  }

  setWorkflowOrchestratorService(workflowOrchestratorService) {
    this.workflowOrchestratorService_ = workflowOrchestratorService
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.extendActiveLocks()
      } catch (error) {
        this.logger_?.warn("Failed to extend locks during heartbeat")
      }
    }, RedisDistributedTransactionStorage.HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
  }

  private async extendActiveLocks() {
    if (this.activeLocks.size === 0) return

    const pipeline = this.redisClient.pipeline()

    for (const lockKey of this.activeLocks) {
      pipeline.expire(
        lockKey,
        RedisDistributedTransactionStorage.EXECUTION_LOCK_TTL
      )
    }

    await pipeline.exec()
  }

  private async saveToDb(data: TransactionCheckpoint, retentionTime?: number) {
    const isNotStarted = data.flow.state === TransactionState.NOT_STARTED
    const isFinished = [
      TransactionState.DONE,
      TransactionState.FAILED,
      TransactionState.REVERTED,
    ].includes(data.flow.state)

    const isFlowInvoking = data.flow.state === TransactionState.INVOKING
    const currentSteps = Object.values(data.flow.steps).filter((step) => {
      if (step.id === "_root") {
        return false
      }

      if (isFlowInvoking) {
        return step.invoke.state === TransactionStepState.INVOKING
      }

      return step.compensate.state === TransactionStepState.COMPENSATING
    })

    const currentStepsIsAsync = currentSteps.some(
      (currentStep) => currentStep?.definition?.async === true
    )

    if (!(isNotStarted || isFinished) && !currentStepsIsAsync) {
      return
    }

    const promise = this.workflowExecutionService_.upsert([
      {
        workflow_id: data.flow.modelId,
        transaction_id: data.flow.transactionId,
        run_id: data.flow.runId,
        execution: data.flow,
        context: {
          data: data.context,
          errors: data.errors,
        },
        state: data.flow.state,
        retention_time: retentionTime,
      },
    ])

    if (isNotStarted || isFinished || currentStepsIsAsync) {
      await promise
    } else {
      return
    }
  }

  private async deleteFromDb(data: TransactionCheckpoint) {
    await this.workflowExecutionService_.delete([
      {
        run_id: data.flow.runId,
      },
    ])
  }

  private async executeTransaction(
    workflowId: string,
    transactionId: string,
    transactionMetadata: TransactionFlow["metadata"] = {}
  ) {
    return await this.workflowOrchestratorService_.run(workflowId, {
      transactionId,
      logOnError: true,
      throwOnError: false,
      context: {
        eventGroupId: transactionMetadata.eventGroupId,
        parentStepIdempotencyKey: transactionMetadata.parentStepIdempotencyKey,
        preventReleaseEvents: transactionMetadata.preventReleaseEvents,
      },
    })
  }

  private async executeScheduledJob(
    jobId: string,
    schedulerOptions: SchedulerOptions
  ) {
    try {
      // TODO: In the case of concurrency being forbidden, we want to generate a predictable transaction ID and rely on the idempotency
      // of the transaction to ensure that the transaction is only executed once.
      await this.workflowOrchestratorService_.run(jobId, {
        logOnError: true,
      })
    } catch (e) {
      if (e instanceof MedusaError && e.type === MedusaError.Types.NOT_FOUND) {
        this.logger_?.warn(
          `Tried to execute a scheduled workflow with ID ${jobId} that does not exist, removing it from the scheduler.`
        )

        await this.remove(jobId)
        return
      }

      throw e
    }
  }

  async get(
    key: string,
    options?: TransactionOptions & { isCancelling?: boolean }
  ): Promise<TransactionCheckpoint | undefined> {
    const [_, workflowId, transactionId] = key.split(":")
    const trx = await this.workflowExecutionService_
      .list(
        {
          workflow_id: workflowId,
          transaction_id: transactionId,
        },
        {
          select: ["execution", "context"],
          order: {
            id: "desc",
          },
          take: 1,
        }
      )
      .then((trx) => trx[0])
      .catch(() => undefined)

    if (trx) {
      const rawData = await this.redisClient.get(key)

      let flow!: TransactionFlow, errors!: TransactionStepError[]
      if (rawData) {
        const data = JSON.parse(rawData)
        flow = data.flow
        errors = data.errors
      }

      const { idempotent } = options ?? {}
      const execution = trx.execution as TransactionFlow

      if (!idempotent) {
        const isFailedOrReverted = [
          TransactionState.REVERTED,
          TransactionState.FAILED,
        ].includes(execution.state)

        const isDone = execution.state === TransactionState.DONE

        const isCancellingAndFailedOrReverted =
          options?.isCancelling && isFailedOrReverted

        const isNotCancellingAndDoneOrFailedOrReverted =
          !options?.isCancelling && (isDone || isFailedOrReverted)

        if (
          isCancellingAndFailedOrReverted ||
          isNotCancellingAndDoneOrFailedOrReverted
        ) {
          return
        }
      }

      if (workflowId === "workflow_1") {
        console.log(
          ">>>>>>>>> get from db",
          JSON.stringify(trx.context?.data, null, 2)
        )
      }
      return {
        flow: flow ?? (trx.execution as TransactionFlow),
        context: trx.context?.data as TransactionContext,
        errors: errors ?? (trx.context?.errors as TransactionStepError[]),
      }
    }

    return
  }

  async save(
    key: string,
    data: TransactionCheckpoint,
    ttl?: number,
    options?: TransactionOptions
  ): Promise<void> {
    /**
     * Store the retention time only if the transaction is done, failed or reverted.
     * From that moment, this tuple can be later on archived or deleted after the retention time.
     */
    const hasFinished = [
      TransactionState.DONE,
      TransactionState.FAILED,
      TransactionState.REVERTED,
    ].includes(data.flow.state)

    const { retentionTime } = options ?? {}

    const lockKey = `${RedisDistributedTransactionStorage.EXECUTION_LOCK_PREFIX}${key}`

    await this.#preventRaceConditionExecutionIfNecessary({
      data,
      lockKey,
    })

    if (hasFinished && retentionTime) {
      Object.assign(data, {
        retention_time: retentionTime,
      })
    }

    // Only set if not exists
    const shouldSetNX =
      data.flow.state === TransactionState.NOT_STARTED &&
      !data.flow.transactionId.startsWith("auto-")

    // Prepare operations to be executed in batch or pipeline
    const data_ = {
      errors: data.errors,
      flow: data.flow,
    }
    const stringifiedData = JSON.stringify(data_)
    const pipeline = this.redisClient.pipeline()

    // Execute Redis operations
    if (!hasFinished) {
      if (ttl) {
        if (shouldSetNX) {
          pipeline.set(key, stringifiedData, "EX", ttl, "NX")
        } else {
          pipeline.set(key, stringifiedData, "EX", ttl)
        }
      } else {
        if (shouldSetNX) {
          pipeline.set(key, stringifiedData, "NX")
        } else {
          pipeline.set(key, stringifiedData)
        }
      }
    } else {
      pipeline.unlink(key)
    }

    // Clean up lock when transaction finishes or is cancelled
    const isCancelled = !!data.flow.cancelledAt
    if (hasFinished || isCancelled) {
      pipeline.del(lockKey)
      this.activeLocks.delete(lockKey)
    }

    const pipelinePromise = pipeline.exec().then((result) => {
      if (!shouldSetNX) {
        return result
      }

      const actionResult = result?.pop()
      const isOk = !!actionResult?.pop()
      if (!isOk) {
        throw new MedusaError(
          MedusaError.Types.INVALID_ARGUMENT,
          "Transaction already started for transactionId: " +
            data.flow.transactionId
        )
      }

      return result
    })

    // Database operations
    if (hasFinished && !retentionTime) {
      // If the workflow is nested, we cant just remove it because it would break the compensation algorithm. Instead, it will get deleted when the top level parent is deleted.
      if (!data.flow.metadata?.parentStepIdempotencyKey) {
        void this.deleteFromDb(data)
        await pipelinePromise
      } else {
        await promiseAll([pipelinePromise, this.saveToDb(data, retentionTime)])
      }
    } else {
      await promiseAll([pipelinePromise, this.saveToDb(data, retentionTime)])
    }
  }

  async scheduleRetry(
    transaction: DistributedTransactionType,
    step: TransactionStep,
    timestamp: number,
    interval: number
  ): Promise<void> {
    await this.queue.add(
      JobType.RETRY,
      {
        workflowId: transaction.modelId,
        transactionId: transaction.transactionId,
        transactionMetadata: transaction.getFlow().metadata,
        stepId: step.id,
      },
      {
        delay: interval > 0 ? interval * 1000 : undefined,
        jobId: this.getJobId(JobType.RETRY, transaction, step),
        removeOnComplete: true,
      }
    )
  }

  async clearRetry(
    transaction: DistributedTransactionType,
    step: TransactionStep
  ): Promise<void> {
    await this.removeJob(JobType.RETRY, transaction, step)
  }

  async scheduleTransactionTimeout(
    transaction: DistributedTransactionType,
    _: number,
    interval: number
  ): Promise<void> {
    await this.queue.add(
      JobType.TRANSACTION_TIMEOUT,
      {
        workflowId: transaction.modelId,
        transactionId: transaction.transactionId,
        transactionMetadata: transaction.getFlow().metadata,
      },
      {
        delay: interval * 1000,
        jobId: this.getJobId(JobType.TRANSACTION_TIMEOUT, transaction),
        removeOnComplete: true,
      }
    )
  }

  async clearTransactionTimeout(
    transaction: DistributedTransactionType
  ): Promise<void> {
    await this.removeJob(JobType.TRANSACTION_TIMEOUT, transaction)
  }

  async scheduleStepTimeout(
    transaction: DistributedTransactionType,
    step: TransactionStep,
    timestamp: number,
    interval: number
  ): Promise<void> {
    await this.queue.add(
      JobType.STEP_TIMEOUT,
      {
        workflowId: transaction.modelId,
        transactionId: transaction.transactionId,
        transactionMetadata: transaction.getFlow().metadata,
        stepId: step.id,
      },
      {
        delay: interval * 1000,
        jobId: this.getJobId(JobType.STEP_TIMEOUT, transaction, step),
        removeOnComplete: true,
      }
    )
  }

  async clearStepTimeout(
    transaction: DistributedTransactionType,
    step: TransactionStep
  ): Promise<void> {
    await this.removeJob(JobType.STEP_TIMEOUT, transaction, step)
  }

  private getJobId(
    type: JobType,
    transaction: DistributedTransactionType,
    step?: TransactionStep
  ) {
    const key = [type, transaction.modelId, transaction.transactionId]

    if (step) {
      key.push(step.id, step.attempts + "")
      if (step.isCompensating()) {
        key.push("compensate")
      }
    }

    return key.join(":")
  }

  private async removeJob(
    type: JobType,
    transaction: DistributedTransactionType,
    step?: TransactionStep
  ) {
    const jobId = this.getJobId(type, transaction, step)

    if (type === JobType.SCHEDULE) {
      const job = await this.jobQueue?.getJob(jobId)
      if (job) {
        await job.remove()
      }
    } else {
      const job = await this.queue.getJob(jobId)

      if (job && job.attemptsStarted === 0) {
        await job.remove()
      }
    }
  }

  /* Scheduler storage methods */
  async schedule(
    jobDefinition: string | { jobId: string },
    schedulerOptions: SchedulerOptions
  ): Promise<void> {
    const jobId =
      typeof jobDefinition === "string" ? jobDefinition : jobDefinition.jobId

    if ("cron" in schedulerOptions && "interval" in schedulerOptions) {
      throw new Error(
        `Unable to register a job with both scheduler options interval and cron.`
      )
    }

    const repeatOptions: RepeatOptions = {
      limit: schedulerOptions.numberOfExecutions,
      key: `${JobType.SCHEDULE}_${jobId}`,
    }

    if ("cron" in schedulerOptions) {
      repeatOptions.pattern = schedulerOptions.cron
    } else {
      repeatOptions.every = schedulerOptions.interval
    }

    // If it is the same key (eg. the same workflow name), the old one will get overridden.
    await this.jobQueue?.add(
      JobType.SCHEDULE,
      {
        jobId,
        schedulerOptions,
      },
      {
        repeat: repeatOptions,
        removeOnComplete: {
          age: 86400,
          count: 1000,
        },
        removeOnFail: {
          age: 604800,
          count: 5000,
        },
      }
    )
  }

  async remove(jobId: string): Promise<void> {
    await this.jobQueue?.removeRepeatableByKey(`${JobType.SCHEDULE}_${jobId}`)
  }

  async removeAll(): Promise<void> {
    return await this.removeAllRepeatableJobs(this.jobQueue!)
  }

  private async removeAllRepeatableJobs(queue: Queue): Promise<void> {
    const repeatableJobs = (await queue.getRepeatableJobs()) ?? []
    await promiseAll(
      repeatableJobs.map((job) => queue.removeRepeatableByKey(job.key))
    )
  }

  async #preventRaceConditionExecutionIfNecessary({
    data,
    lockKey,
  }: {
    data: TransactionCheckpoint
    lockKey: string
  }) {
    // Use Redis lock for race condition prevention instead of expensive checks
    const isInitialCheckpoint = data.flow.state === TransactionState.NOT_STARTED
    const isCancelled = !!data.flow.cancelledAt
    const isCompensating = data.flow.state === TransactionState.COMPENSATING

    if (isInitialCheckpoint && !isCompensating) {
      const lockAcquired = await this.redisClient.set(
        lockKey,
        Date.now().toString(),
        "EX",
        RedisDistributedTransactionStorage.EXECUTION_LOCK_TTL,
        "NX"
      )

      if (!lockAcquired) {
        throw new SkipExecutionError(
          "Transaction already started for transactionId: " +
            data.flow.transactionId
        )
      }

      // Track this lock for heartbeat extension
      this.activeLocks.add(lockKey)
    } else if (!isInitialCheckpoint && !isCancelled) {
      const lockExists = await this.redisClient.exists(lockKey)
      if (!lockExists) {
        throw new SkipExecutionError(
          "Execution lock not found - likely finished by another execution"
        )
      }
    }
  }

  async clearExpiredExecutions() {
    await this.workflowExecutionService_.delete({
      retention_time: {
        $ne: null,
      },
      updated_at: {
        $lte: raw(
          (alias) =>
            `CURRENT_TIMESTAMP - (INTERVAL '1 second' * "retention_time")`
        ),
      },
      state: {
        $in: [
          TransactionState.DONE,
          TransactionState.FAILED,
          TransactionState.REVERTED,
        ],
      },
    })
  }
}
