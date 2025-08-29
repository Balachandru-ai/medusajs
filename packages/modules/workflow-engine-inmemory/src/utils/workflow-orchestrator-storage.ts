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
import { raw } from "@mikro-orm/core"
import { WorkflowOrchestratorService } from "@services"
import { type CronExpression, parseExpression } from "cron-parser"
import { WorkflowExecution } from "../models/workflow-execution"

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

export class InMemoryDistributedTransactionStorage
  implements IDistributedTransactionStorage, IDistributedSchedulerStorage
{
  private workflowExecutionService_: ModulesSdkTypes.IMedusaInternalService<any>
  private logger_: Logger
  private workflowOrchestratorService_: WorkflowOrchestratorService

  private storage: Map<string, Omit<TransactionCheckpoint, "context">> =
    new Map()
  private scheduled: Map<
    string,
    {
      timer: NodeJS.Timeout
      expression: CronExpression | number
      numberOfExecutions: number
      config: SchedulerOptions
    }
  > = new Map()
  private retries: Map<string, unknown> = new Map()
  private timeouts: Map<string, unknown> = new Map()
  private executionLocks: Set<string> = new Set()
  private lockTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private static readonly EXECUTION_LOCK_TTL = 1800000 // 30min in milliseconds

  private clearTimeout_: NodeJS.Timeout

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

  async onApplicationStart() {
    this.clearTimeout_ = setInterval(async () => {
      try {
        await this.clearExpiredExecutions()
      } catch {}
    }, 1000 * 60 * 60)
  }

  async onApplicationShutdown() {
    clearInterval(this.clearTimeout_)
  }

  setWorkflowOrchestratorService(workflowOrchestratorService) {
    this.workflowOrchestratorService_ = workflowOrchestratorService
  }

  private async saveToDb(data: TransactionCheckpoint, retentionTime?: number) {
    await this.workflowExecutionService_.upsert([
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
  }

  private async deleteFromDb(data: TransactionCheckpoint) {
    await this.workflowExecutionService_.delete([
      {
        run_id: data.flow.runId,
      },
    ])
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
      const { flow, errors } = this.storage.get(key) ?? {}
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

    await this.#preventRaceConditionExecutionIfNecessary({
      data,
      key,
    })

    // Only store retention time if it's provided
    if (retentionTime) {
      Object.assign(data, {
        retention_time: retentionTime,
      })
    }

    const { flow, errors } = data
    this.storage.set(key, {
      flow,
      errors,
    })

    // Optimize DB operations - only perform when necessary
    if (hasFinished) {
      if (!retentionTime) {
        // If the workflow is nested, we cant just remove it because it would break the compensation algorithm. Instead, it will get deleted when the top level parent is deleted.
        if (!flow.metadata?.parentStepIdempotencyKey) {
          await this.deleteFromDb(data)
        } else {
          await this.saveToDb(data, retentionTime)
        }
      } else {
        await this.saveToDb(data, retentionTime)
      }

      this.storage.delete(key)
    } else {
      await this.saveToDb(data, retentionTime)
    }

    const isCancelled = !!data.flow.cancelledAt
    if (hasFinished || isCancelled) {
      this.executionLocks.delete(key)

      // Clear the timeout to prevent unnecessary cleanup
      const timeoutId = this.lockTimeouts.get(key)
      if (timeoutId) {
        clearTimeout(timeoutId)
        this.lockTimeouts.delete(key)
      }
    }
  }

  async #preventRaceConditionExecutionIfNecessary({
    data,
    key,
  }: {
    data: TransactionCheckpoint
    key: string
  }) {
    const isInitialCheckpoint = data.flow.state === TransactionState.NOT_STARTED
    const isCancelled = !!data.flow.cancelledAt
    const isCompensating = data.flow.state === TransactionState.COMPENSATING

    if (isInitialCheckpoint && !isCompensating) {
      if (this.executionLocks.has(key)) {
        throw new SkipExecutionError(
          "Transaction already started for transactionId: " +
            data.flow.transactionId
        )
      }
      this.executionLocks.add(key)

      // Set TTL for automatic cleanup (safety net for crashed workflows)
      const timeoutId = setTimeout(() => {
        this.executionLocks.delete(key)
        this.lockTimeouts.delete(key)
      }, InMemoryDistributedTransactionStorage.EXECUTION_LOCK_TTL)

      this.lockTimeouts.set(key, timeoutId)
    } else if (!isInitialCheckpoint && !isCancelled) {
      if (!this.executionLocks.has(key)) {
        throw new SkipExecutionError(
          "Execution lock not found - likely finished by another execution"
        )
      }

      // Renew the lock TTL to prevent expiration during long-running workflows
      const oldTimeoutId = this.lockTimeouts.get(key)
      if (oldTimeoutId) {
        clearTimeout(oldTimeoutId)
      }

      const newTimeoutId = setTimeout(() => {
        this.executionLocks.delete(key)
        this.lockTimeouts.delete(key)
      }, InMemoryDistributedTransactionStorage.EXECUTION_LOCK_TTL)

      this.lockTimeouts.set(key, newTimeoutId)
    }
  }

  async scheduleRetry(
    transaction: DistributedTransactionType,
    step: TransactionStep,
    timestamp: number,
    interval: number
  ): Promise<void> {
    const { modelId: workflowId, transactionId } = transaction

    const inter = setTimeout(async () => {
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

    const key = `${workflowId}:${transactionId}:${step.id}`
    this.retries.set(key, inter)
  }

  async clearRetry(
    transaction: DistributedTransactionType,
    step: TransactionStep
  ): Promise<void> {
    const { modelId: workflowId, transactionId } = transaction

    const key = `${workflowId}:${transactionId}:${step.id}`
    const inter = this.retries.get(key)
    if (inter) {
      clearTimeout(inter as NodeJS.Timeout)
      this.retries.delete(key)
    }
  }

  async scheduleTransactionTimeout(
    transaction: DistributedTransactionType,
    timestamp: number,
    interval: number
  ): Promise<void> {
    const { modelId: workflowId, transactionId } = transaction

    const inter = setTimeout(async () => {
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

    const key = `${workflowId}:${transactionId}`
    this.timeouts.set(key, inter)
  }

  async clearTransactionTimeout(
    transaction: DistributedTransactionType
  ): Promise<void> {
    const { modelId: workflowId, transactionId } = transaction

    const key = `${workflowId}:${transactionId}`
    const inter = this.timeouts.get(key)
    if (inter) {
      clearTimeout(inter as NodeJS.Timeout)
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

    const inter = setTimeout(async () => {
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

    const key = `${workflowId}:${transactionId}:${step.id}`
    this.timeouts.set(key, inter)
  }

  async clearStepTimeout(
    transaction: DistributedTransactionType,
    step: TransactionStep
  ): Promise<void> {
    const { modelId: workflowId, transactionId } = transaction

    const key = `${workflowId}:${transactionId}:${step.id}`
    const inter = this.timeouts.get(key)
    if (inter) {
      clearTimeout(inter as NodeJS.Timeout)
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

      // Only schedule the next job execution after the current one completes successfully
      const timer = setTimeout(async () => {
        setImmediate(() => {
          this.jobHandler(jobId)
        })
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
    await this.workflowExecutionService_.delete({
      retention_time: {
        $ne: null,
      },
      updated_at: {
        $lte: raw(
          (alias) =>
            `CURRENT_TIMESTAMP - (INTERVAL '1 second' * retention_time)`
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
