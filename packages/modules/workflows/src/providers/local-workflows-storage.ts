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
import {
  InferEntityType,
  Logger,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import { MedusaError, TransactionState } from "@medusajs/framework/utils"
import { type CronExpression, parseExpression } from "cron-parser"
import { WorkflowExecution } from "../models/workflow-execution"
import {
  clearExpiredExecutions as clearExpiredExecutionsUtil,
  deleteFromDb as deleteFromDbUtil,
  failedStates,
  finishedStates,
  preventRaceConditionExecutionIfNecessary,
  saveToDb as saveToDbUtil,
} from "../utils"

const THIRTY_MINUTES_IN_MS = 1000 * 60 * 30

function calculateDelayFromExpression(expression: CronExpression): number {
  const nextTime = expression.next().getTime()
  const now = Date.now()
  const delay = nextTime - now

  // If the calculated delay is negative or zero, get the next occurrence
  if (delay <= 0) {
    const nextNextTime = expression.next().getTime()
    return Math.max(1, nextNextTime - now)
  }

  return delay
}

function parseNextExecution(
  optionsOrExpression: SchedulerOptions | CronExpression | string | number
) {
  if (typeof optionsOrExpression === "object") {
    if ("cron" in optionsOrExpression) {
      const expression = parseExpression(optionsOrExpression.cron)
      return calculateDelayFromExpression(expression)
    }

    if ("interval" in optionsOrExpression) {
      return optionsOrExpression.interval
    }

    return calculateDelayFromExpression(optionsOrExpression)
  }

  const result = parseInt(`${optionsOrExpression}`)

  if (isNaN(result)) {
    const expression = parseExpression(`${optionsOrExpression}`)
    return calculateDelayFromExpression(expression)
  }

  return result
}

export class LocalWorkflowsStorage
  implements IDistributedTransactionStorage, IDistributedSchedulerStorage
{
  private workflowExecutionService_: ModulesSdkTypes.IMedusaInternalService<any>
  private logger_: Logger
  private workflowOrchestratorService_: any

  private storage: Record<string, TransactionCheckpoint> = {}
  private scheduled: Map<
    string,
    {
      timer: NodeJS.Timeout
      expression: CronExpression | number
      numberOfExecutions: number
      config: SchedulerOptions
    }
  > = new Map()
  private retries: Map<string, NodeJS.Timeout> = new Map()
  private timeouts: Map<string, NodeJS.Timeout> = new Map()
  private pendingTimers: Set<NodeJS.Timeout> = new Set()

  private clearTimeout_: NodeJS.Timeout
  private isLocked: Map<string, boolean> = new Map()

  constructor({
    workflowExecutionService,
    logger,
  }: {
    workflowExecutionService: ModulesSdkTypes.IMedusaInternalService<any>
    logger: Logger
  }) {
    this.workflowExecutionService_ = workflowExecutionService
    this.logger_ = logger
  }

  __hooks = {
    onApplicationStart: this.onApplicationStart.bind(this),
    onApplicationPrepareShutdown: this.onApplicationPrepareShutdown.bind(this),
    onApplicationShutdown: this.onApplicationShutdown.bind(this),
  }

  private async onApplicationStart() {
    this.clearTimeout_ = setInterval(async () => {
      try {
        await this.clearExpiredExecutions()
      } catch {}
    }, THIRTY_MINUTES_IN_MS)
  }

  private async onApplicationPrepareShutdown() {
    // Stop scheduled jobs from firing during shutdown
    for (const job of this.scheduled.values()) {
      clearTimeout(job.timer)
    }

    // Stop retry and timeout timers
    for (const timer of this.retries.values()) {
      clearTimeout(timer)
    }

    for (const timer of this.timeouts.values()) {
      clearTimeout(timer)
    }

    // Stop pending timers
    for (const timer of this.pendingTimers) {
      clearTimeout(timer)
    }
  }

  private async onApplicationShutdown() {
    clearInterval(this.clearTimeout_)

    for (const timer of this.pendingTimers) {
      clearTimeout(timer)
    }
    this.pendingTimers.clear()

    for (const timer of this.retries.values()) {
      clearTimeout(timer)
    }
    this.retries.clear()

    for (const timer of this.timeouts.values()) {
      clearTimeout(timer)
    }
    this.timeouts.clear()

    // Clean up scheduled job timers
    for (const job of this.scheduled.values()) {
      clearTimeout(job.timer)
    }
    this.scheduled.clear()
  }

  setWorkflowOrchestratorService(workflowOrchestratorService) {
    this.workflowOrchestratorService_ = workflowOrchestratorService
  }

  setWorkflowExecutionService(workflowExecutionService) {
    this.workflowExecutionService_ = workflowExecutionService
  }

  private createManagedTimer(
    callback: () => void | Promise<void>,
    delay: number
  ): NodeJS.Timeout {
    const timer = setTimeout(async () => {
      this.pendingTimers.delete(timer)
      const res = callback()
      if (res instanceof Promise) {
        await res
      }
    }, delay)

    this.pendingTimers.add(timer)
    return timer
  }

  private async saveToDb(data: TransactionCheckpoint, retentionTime?: number) {
    await saveToDbUtil(this.workflowExecutionService_, data, retentionTime)
  }

  private async deleteFromDb(data: TransactionCheckpoint) {
    await deleteFromDbUtil(this.workflowExecutionService_, data)
  }

  async get(
    key: string,
    options?: TransactionOptions & {
      isCancelling?: boolean
    }
  ): Promise<TransactionCheckpoint | undefined> {
    const [_, workflowId, transactionId] = key.split(":")
    const trx: InferEntityType<typeof WorkflowExecution> | undefined =
      await this.workflowExecutionService_
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
      const { flow, errors } = this.storage[key]
        ? JSON.parse(JSON.stringify(this.storage[key]))
        : {}
      const { idempotent } = options ?? {}
      const execution = trx.execution as TransactionFlow

      if (!idempotent) {
        const isFailedOrReverted = failedStates.has(execution.state)

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

      return new TransactionCheckpoint(
        flow ?? (trx?.execution as TransactionFlow),
        trx?.context?.data as TransactionContext,
        errors ?? (trx?.context?.errors as TransactionStepError[])
      )
    }

    return
  }

  async save(
    key: string,
    data: TransactionCheckpoint,
    ttl?: number,
    options?: TransactionOptions
  ): Promise<TransactionCheckpoint> {
    if (this.isLocked.has(key)) {
      throw new Error("Transaction storage is locked")
    }

    this.isLocked.set(key, true)

    try {
      /**
       * Store the retention time only if the transaction is done, failed or reverted.
       * From that moment, this tuple can be later on archived or deleted after the retention time.
       */
      const { retentionTime } = options ?? {}

      const hasFinished = finishedStates.has(data.flow.state)

      const cachedData = this.storage[key] as TransactionCheckpoint | undefined
      await preventRaceConditionExecutionIfNecessary({
        data,
        options,
        cachedData,
        getStoredData: () =>
          this.get(key, {
            ...options,
            isCancelling: !!data.flow.cancelledAt,
          } as TransactionOptions),
      })

      // Only store retention time if it's provided
      if (retentionTime) {
        Object.assign(data, {
          retention_time: retentionTime,
        })
      }

      // Store in memory
      const isNotStarted = data.flow.state === TransactionState.NOT_STARTED
      const isManualTransactionId = !data.flow.transactionId.startsWith("auto-")

      if (isNotStarted && isManualTransactionId) {
        const storedData = this.storage[key]
        if (storedData) {
          throw new SkipExecutionError(
            "Transaction already started for transactionId: " +
              data.flow.transactionId
          )
        }
      }

      if (data.flow._v) {
        const storedData = await this.get(key, {
          isCancelling: !!data.flow.cancelledAt,
        } as any)

        TransactionCheckpoint.mergeCheckpoints(data, storedData)
      }

      const { flow, context, errors } = data

      this.storage[key] = {
        flow: JSON.parse(JSON.stringify(flow)),
        context: JSON.parse(JSON.stringify(context)),
        errors: [...errors],
      } as TransactionCheckpoint

      // Optimize DB operations - only perform when necessary
      if (hasFinished) {
        if (!retentionTime) {
          if (!flow.metadata?.parentStepIdempotencyKey) {
            await this.deleteFromDb(data)
          } else {
            await this.saveToDb(data, retentionTime)
          }
        } else {
          await this.saveToDb(data, retentionTime)
        }

        delete this.storage[key]
      } else {
        await this.saveToDb(data, retentionTime)
      }

      return data
    } finally {
      this.isLocked.delete(key)
    }
  }

  async scheduleRetry(
    transaction: DistributedTransactionType,
    step: TransactionStep,
    timestamp: number,
    interval: number
  ): Promise<void> {
    const { modelId: workflowId, transactionId } = transaction
    const key = `${workflowId}:${transactionId}:${step.id}`

    const existingTimer = this.retries.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
      this.pendingTimers.delete(existingTimer)
    }

    const timer = this.createManagedTimer(async () => {
      this.retries.delete(key)
      const context = transaction.getFlow().metadata ?? {}
      await this.workflowOrchestratorService_.run(workflowId, {
        transactionId,
        logOnError: true,
        throwOnError: false,
        context: {
          eventGroupId: context.eventGroupId,
          parentStepIdempotencyKey: context.parentStepIdempotencyKey,
          preventReleaseEvents: context.preventReleaseEvents,
        },
      })
    }, interval * 1e3)

    this.retries.set(key, timer)
  }

  async clearRetry(
    transaction: DistributedTransactionType,
    step: TransactionStep
  ): Promise<void> {
    const { modelId: workflowId, transactionId } = transaction

    const key = `${workflowId}:${transactionId}:${step.id}`
    const timer = this.retries.get(key)
    if (timer) {
      clearTimeout(timer)
      this.pendingTimers.delete(timer)
      this.retries.delete(key)
    }
  }

  async scheduleTransactionTimeout(
    transaction: DistributedTransactionType,
    timestamp: number,
    interval: number
  ): Promise<void> {
    const { modelId: workflowId, transactionId } = transaction
    const key = `${workflowId}:${transactionId}`

    const existingTimer = this.timeouts.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
      this.pendingTimers.delete(existingTimer)
    }

    const timer = this.createManagedTimer(async () => {
      this.timeouts.delete(key)
      const context = transaction.getFlow().metadata ?? {}
      await this.workflowOrchestratorService_.run(workflowId, {
        transactionId,
        logOnError: true,
        throwOnError: false,
        context: {
          eventGroupId: context.eventGroupId,
          parentStepIdempotencyKey: context.parentStepIdempotencyKey,
          preventReleaseEvents: context.preventReleaseEvents,
        },
      })
    }, interval * 1e3)

    this.timeouts.set(key, timer)
  }

  async clearTransactionTimeout(
    transaction: DistributedTransactionType
  ): Promise<void> {
    const { modelId: workflowId, transactionId } = transaction

    const key = `${workflowId}:${transactionId}`
    const timer = this.timeouts.get(key)
    if (timer) {
      clearTimeout(timer)
      this.pendingTimers.delete(timer)
      this.timeouts.delete(key)
    }
  }

  async scheduleStepTimeout(
    transaction: DistributedTransactionType,
    step: TransactionStep,
    timestamp: number,
    interval: number
  ): Promise<void> {
    const { modelId: workflowId, transactionId } = transaction
    const key = `${workflowId}:${transactionId}:${step.id}`

    const existingTimer = this.timeouts.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
      this.pendingTimers.delete(existingTimer)
    }

    const timer = this.createManagedTimer(async () => {
      this.timeouts.delete(key)
      const context = transaction.getFlow().metadata ?? {}
      await this.workflowOrchestratorService_.run(workflowId, {
        transactionId,
        logOnError: true,
        throwOnError: false,
        context: {
          eventGroupId: context.eventGroupId,
          parentStepIdempotencyKey: context.parentStepIdempotencyKey,
          preventReleaseEvents: context.preventReleaseEvents,
        },
      })
    }, interval * 1e3)

    this.timeouts.set(key, timer)
  }

  async clearStepTimeout(
    transaction: DistributedTransactionType,
    step: TransactionStep
  ): Promise<void> {
    const { modelId: workflowId, transactionId } = transaction

    const key = `${workflowId}:${transactionId}:${step.id}`
    const timer = this.timeouts.get(key)
    if (timer) {
      clearTimeout(timer)
      this.pendingTimers.delete(timer)
      this.timeouts.delete(key)
    }
  }

  /* Scheduler storage methods */
  async schedule(
    jobDefinition: string | { jobId: string },
    schedulerOptions: SchedulerOptions
  ): Promise<void> {
    const jobId =
      typeof jobDefinition === "string" ? jobDefinition : jobDefinition.jobId

    // In order to ensure that the schedule configuration is always up to date, we first cancel an existing job, if there was one
    await this.remove(jobId)

    let expression: CronExpression | number
    let nextExecution = parseNextExecution(schedulerOptions)

    if ("cron" in schedulerOptions) {
      // Cache the parsed expression to avoid repeated parsing
      expression = parseExpression(schedulerOptions.cron)
    } else if ("interval" in schedulerOptions) {
      expression = schedulerOptions.interval
    } else {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Schedule cron or interval definition is required for scheduled jobs."
      )
    }

    const timer = setTimeout(async () => {
      this.jobHandler(jobId)
    }, nextExecution)

    // Set the timer's unref to prevent it from keeping the process alive
    timer.unref()

    this.scheduled.set(jobId, {
      timer,
      expression,
      numberOfExecutions: 0,
      config: schedulerOptions,
    })
  }

  async remove(jobId: string): Promise<void> {
    const job = this.scheduled.get(jobId)
    if (!job) {
      return
    }

    clearTimeout(job.timer)
    this.scheduled.delete(jobId)
  }

  async removeAll(): Promise<void> {
    for (const [key] of this.scheduled) {
      await this.remove(key)
    }
  }

  async jobHandler(jobId: string) {
    const job = this.scheduled.get(jobId)
    if (!job) {
      return
    }

    if (
      job.config?.numberOfExecutions !== undefined &&
      job.config.numberOfExecutions <= job.numberOfExecutions
    ) {
      this.scheduled.delete(jobId)
      return
    }

    const nextExecution = parseNextExecution(job.expression)

    try {
      await this.workflowOrchestratorService_.run(jobId, {
        logOnError: true,
        throwOnError: false,
      })

      const timer = this.createManagedTimer(() => {
        this.jobHandler(jobId)
      }, nextExecution)

      // Prevent timer from keeping the process alive
      timer.unref()

      this.scheduled.set(jobId, {
        timer,
        expression: job.expression,
        numberOfExecutions: (job.numberOfExecutions ?? 0) + 1,
        config: job.config,
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

  async clearExpiredExecutions(): Promise<void> {
    await clearExpiredExecutionsUtil(this.workflowExecutionService_)
  }
}
