import { raw } from "@medusajs/framework/mikro-orm/core"
import {
  DistributedTransactionType,
  IDistributedSchedulerStorage,
  IDistributedTransactionStorage,
  SchedulerOptions,
  SkipCancelledExecutionError,
  SkipExecutionError,
  SkipStepAlreadyFinishedError,
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
import {
  isPresent,
  MedusaError,
  TransactionState,
  TransactionStepState,
  TransactionStepStatus,
} from "@medusajs/framework/utils"
import { WorkflowOrchestratorService } from "@services"
import { type CronExpression, parseExpression } from "cron-parser"
import { WorkflowExecution } from "../models/workflow-execution"
import { setTimeout as setTimeoutPromise } from "timers/promises"

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

export class InMemoryDistributedTransactionStorage
  implements IDistributedTransactionStorage, IDistributedSchedulerStorage
{
  private workflowExecutionService_: ModulesSdkTypes.IMedusaInternalService<any>
  private logger_: Logger
  private workflowOrchestratorService_: WorkflowOrchestratorService

  private storage: Map<string, TransactionCheckpoint> = new Map()
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

  async onApplicationStart() {
    this.clearTimeout_ = setInterval(async () => {
      try {
        await this.clearExpiredExecutions()
      } catch {}
    }, THIRTY_MINUTES_IN_MS)
  }

  async onApplicationShutdown() {
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
    const isNotStarted = data.flow.state === TransactionState.NOT_STARTED
    const asyncVersion = data.flow._v
    const isFinished = [
      TransactionState.DONE,
      TransactionState.FAILED,
      TransactionState.REVERTED,
    ].includes(data.flow.state)
    const isWaitingToCompensate =
      data.flow.state === TransactionState.WAITING_TO_COMPENSATE

    const isFlowInvoking = data.flow.state === TransactionState.INVOKING

    const stepsArray = Object.values(data.flow.steps) as TransactionStep[]
    let currentStep!: TransactionStep

    const targetStates = isFlowInvoking
      ? [
          TransactionStepState.INVOKING,
          TransactionStepState.DONE,
          TransactionStepState.FAILED,
        ]
      : [TransactionStepState.COMPENSATING]

    // Find the current step from the end
    for (let i = stepsArray.length - 1; i >= 0; i--) {
      const step = stepsArray[i]

      if (step.id === "_root") {
        break
      }

      const isTargetState = targetStates.includes(step.invoke?.state)

      if (isTargetState) {
        currentStep = step
        break
      }
    }

    const currentStepsIsAsync = currentStep
      ? stepsArray.some(
          (step) =>
            step?.definition?.async === true && step.depth === currentStep.depth
        )
      : false

    if (
      !(isNotStarted || isFinished || isWaitingToCompensate) &&
      !currentStepsIsAsync &&
      !asyncVersion
    ) {
      return
    }

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

      return new TransactionCheckpoint(
        flow ?? (trx.execution as TransactionFlow),
        trx.context?.data as TransactionContext,
        errors ?? (trx.context?.errors as TransactionStepError[])
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

    // Check if stringified data is cached to avoid double JSON.stringify
    let stringifiedData = (data as any).__getCachedStringified?.()
    let data_ = stringifiedData ? JSON.parse(stringifiedData) : data

    if (!stringifiedData) {
      stringifiedData = JSON.stringify(data)
    }

    let cachedCheckpoint: TransactionCheckpoint | undefined

    const getCheckpoint = async (options?: TransactionOptions) => {
      if (!cachedCheckpoint) {
        cachedCheckpoint = await this.get(key, options)
      }
      return cachedCheckpoint
    }

    await this.#preventRaceConditionExecutionIfNecessary({
      data: data_,
      key,
      options,
      getCheckpoint,
    })

    // Only store retention time if it's provided
    if (retentionTime) {
      Object.assign(data_, {
        retention_time: retentionTime,
      })
    }

    // Store in memory
    const isNotStarted = data_.flow.state === TransactionState.NOT_STARTED
    const isManualTransactionId = !data_.flow.transactionId.startsWith("auto-")

    if (isNotStarted && isManualTransactionId) {
      const storedData = this.storage.get(key)
      if (storedData) {
        throw new SkipExecutionError(
          "Transaction already started for transactionId: " +
            data_.flow.transactionId
        )
      }
    }

    let retries = 0
    let backoffMs = 10
    const maxRetries = (options?.parallelSteps || 1) + 1
    while (retries < maxRetries) {
      let lockAcquired = false

      // if awaiting async step, _v > 0
      try {
        if (data_.flow._v || options?._v) {
          data_.flow._v = options?._v ?? data_.flow._v

          if (this.isLocked.get(key)) {
            retries++
            // Exponential backoff with jitter
            const jitter = Math.random() * backoffMs
            await setTimeoutPromise(backoffMs + jitter)
            backoffMs = Math.min(backoffMs * 2, 1000)
            continue
          }

          this.isLocked.set(key, true)
          lockAcquired = true

          await this.#performVersionCheckAndMerge({
            data: data_,
            stepId: options?.stepId,
            getCheckpoint,
          })
        }

        const { flow, errors } = data_
        this.storage.set(
          key,
          new TransactionCheckpoint(flow, {} as TransactionContext, errors)
        )

        // Optimize DB operations - only perform when necessary
        if (hasFinished) {
          if (!retentionTime) {
            if (!flow.metadata?.parentStepIdempotencyKey) {
              await this.deleteFromDb(data_)
            } else {
              await this.saveToDb(data_, retentionTime)
            }
          } else {
            await this.saveToDb(data_, retentionTime)
          }

          this.storage.delete(key)
        } else {
          await this.saveToDb(data_, retentionTime)
        }
      } finally {
        if (lockAcquired) {
          this.isLocked.set(key, false)
        }
      }

      return data_
    }

    throw new Error(
      "Max retries exceeded for saving checkpoint due to version conflicts"
    )
  }

  async #performVersionCheckAndMerge({
    data,
    stepId,
    getCheckpoint,
  }: {
    data: TransactionCheckpoint
    stepId?: string
    getCheckpoint: (
      options?: TransactionOptions
    ) => Promise<TransactionCheckpoint | undefined>
  }): Promise<void> {
    const currentData = (await getCheckpoint()) as TransactionCheckpoint
    if (currentData.flow._v === data.flow._saved_v) {
      return
    }

    const savingStep = data.flow.steps[stepId!]

    this.#mergeFlow(currentData, data, savingStep)
    this.#mergeErrors(currentData!.errors ?? [], data.errors)

    data.context = currentData.context
    data.errors = currentData.errors
    data.flow = currentData.flow
    data.flow._saved_v += 1
  }

  #mergeFlow(
    currentData: TransactionCheckpoint,
    data: TransactionCheckpoint,
    savingStep?: TransactionStep
  ): void {
    const currentContext = currentData.context
    const latestContext = data.context

    const mergeProperties = [
      "hasFailedSteps",
      "hasSkippedOnFailureSteps",
      "hasSkippedSteps",
      "hasRevertedSteps",
      "_v",
      "_saved_v",
      "timedOutAt",
      "state",
    ]
    const stateFlowOrder = [
      TransactionState.NOT_STARTED,
      TransactionState.INVOKING,
      TransactionState.DONE,
      TransactionState.WAITING_TO_COMPENSATE,
      TransactionState.COMPENSATING,
      TransactionState.REVERTED,
      TransactionState.FAILED,
    ]

    if (data.flow._v >= currentData.flow._v) {
      for (const prop of mergeProperties) {
        if (prop === "_v") {
          currentData.flow._v = Math.max(data.flow._v, currentData.flow._v)
        } else if (prop === "state") {
          const curState = stateFlowOrder.findIndex(
            (state) => state === currentData.flow.state
          )
          const latestState = stateFlowOrder.findIndex(
            (state) => state === data.flow.state
          )

          if (latestState >= curState) {
            currentData.flow.state = data.flow.state
          } else {
            throw new SkipExecutionError(
              `Transaction is behind another execution`
            )
          }
        } else if (data.flow[prop] && !currentData.flow[prop]) {
          currentData.flow[prop] = data.flow[prop]
        }
      }
    }

    if (!savingStep) {
      return
    }

    const stepName = savingStep.definition.action!
    const stepId = savingStep.id

    if (latestContext.invoke[stepName] && !currentContext.invoke[stepName]) {
      currentContext.invoke[stepName] = latestContext.invoke[stepName]
    }

    if (
      latestContext.compensate[stepName] &&
      !currentContext.compensate[stepName]
    ) {
      currentContext.compensate[stepName] = latestContext.compensate[stepName]
    }

    const currentStepVersion = currentData.flow.steps[stepId]._v!
    const savingStepVersion = data.flow.steps[stepId]._v!

    if (currentStepVersion > savingStepVersion) {
      throw new SkipExecutionError(`Transaction is behind another execution`)
    }

    const mergeStep = (currentStep, step) => {
      const mergeProperties = [
        "attempts",
        "failures",
        "temporaryFailedAt",
        "retryRescheduledAt",
        "lastAttempt",
        "_v",
      ]
      for (const prop of mergeProperties) {
        currentStep[prop] =
          step[prop] && currentStep[prop]
            ? Math.max(step[prop], currentStep[prop])
            : step[prop] ?? currentStep[prop]
      }
    }

    let canUpdate = [
      TransactionStepStatus.IDLE,
      TransactionStepStatus.WAITING,
      TransactionStepStatus.TEMPORARY_FAILURE,
    ]
    if (canUpdate.includes(currentData.flow.steps[stepId].compensate.status)) {
      currentData.flow.steps[stepId].compensate = savingStep.compensate
      mergeStep(currentData.flow.steps[stepId], savingStep)
    }

    if (canUpdate.includes(currentData.flow.steps[stepId].invoke.status)) {
      currentData.flow.steps[stepId].invoke = savingStep.invoke
      mergeStep(currentData.flow.steps[stepId], savingStep)
    }
  }

  #mergeErrors(
    currentErrors: TransactionStepError[],
    latestErrors: TransactionStepError[]
  ): void {
    const existingErrorSignatures = new Set(
      currentErrors.map(
        (err) => `${err.action}:${err.handlerType}:${err.error?.message}`
      )
    )

    for (const error of latestErrors) {
      const signature = `${error.action}:${error.handlerType}:${error.error?.message}`
      if (!existingErrorSignatures.has(signature)) {
        currentErrors.push(error)
      }
    }
  }

  async #preventRaceConditionExecutionIfNecessary({
    data,
    key,
    options,
    getCheckpoint,
  }: {
    data: TransactionCheckpoint
    key: string
    options?: TransactionOptions
    getCheckpoint: (
      options: TransactionOptions
    ) => Promise<TransactionCheckpoint | undefined>
  }) {
    const isInitialCheckpoint = [TransactionState.NOT_STARTED].includes(
      data.flow.state
    )
    /**
     * In case many execution can succeed simultaneously, we need to ensure that the latest
     * execution does continue if a previous execution is considered finished
     */
    const currentFlow = data.flow

    const rawData = this.storage.get(key)
    let data_ = {} as TransactionCheckpoint
    if (rawData) {
      data_ = rawData as TransactionCheckpoint
    } else {
      const getOptions = {
        ...options,
        isCancelling: !!data.flow.cancelledAt,
      } as Parameters<typeof this.get>[1]

      data_ =
        (await getCheckpoint(getOptions as TransactionOptions)) ??
        ({ flow: {} } as TransactionCheckpoint)
    }

    const { flow: latestUpdatedFlow } = data_
    if (options?.stepId) {
      const stepId = options.stepId
      const currentStep = data.flow.steps[stepId]
      const latestStep = latestUpdatedFlow.steps?.[stepId]
      if (latestStep && currentStep) {
        const isCompensating =
          data.flow.state === TransactionState.COMPENSATING ||
          data.flow.state === TransactionState.WAITING_TO_COMPENSATE

        const latestState = isCompensating
          ? latestStep.compensate?.state
          : latestStep.invoke?.state

        const currentState = isCompensating
          ? currentStep.compensate?.state
          : currentStep.invoke?.state

        const finishedStates = [
          TransactionStepState.DONE,
          TransactionStepState.FAILED,
        ]

        if (
          finishedStates.includes(latestState) &&
          !finishedStates.includes(currentState)
        ) {
          throw new SkipStepAlreadyFinishedError(
            `Step ${stepId} already finished by another execution`
          )
        }
      }
    }

    if (!isInitialCheckpoint && !isPresent(latestUpdatedFlow)) {
      /**
       * the initial checkpoint expect no other checkpoint to have been stored.
       * In case it is not the initial one and another checkpoint is trying to
       * find if a concurrent execution has finished, we skip the execution.
       * The already finished execution would have deleted the checkpoint already.
       */
      throw new SkipExecutionError("Already finished by another execution")
    }

    // Ensure that the latest execution was not cancelled, otherwise we skip the execution
    const latestTransactionCancelledAt = latestUpdatedFlow.cancelledAt
    const currentTransactionCancelledAt = currentFlow.cancelledAt

    if (
      !!latestTransactionCancelledAt &&
      currentTransactionCancelledAt == null
    ) {
      throw new SkipCancelledExecutionError(
        "Workflow execution has been cancelled during the execution"
      )
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
