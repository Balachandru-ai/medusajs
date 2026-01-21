import {
  DistributedNotifyOptions,
  DistributedTransaction,
  DistributedTransactionEvents,
  DistributedTransactionType,
  IDistributedSchedulerStorage,
  IDistributedTransactionStorage,
  TransactionHandlerType,
  TransactionStep,
  WorkflowScheduler,
} from "@medusajs/framework/orchestration"
import {
  ContainerLike,
  Context,
  IWorkflowModuleOrchestratorService,
  Logger,
  MedusaContainer,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  isString,
  MedusaError,
  promiseAll,
  TransactionState,
} from "@medusajs/framework/utils"
import {
  type FlowRunOptions,
  MedusaWorkflow,
  resolveValue,
  ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { WorkflowOrchestratorCancelOptions } from "@types"
import { ulid } from "ulid"
import { WORKFLOWS_STORAGE_REGISTRATION_KEY } from "../loaders/providers"

export type WorkflowOrchestratorRunOptions<T> = Omit<
  FlowRunOptions<T>,
  "container"
> & {
  transactionId?: string
  runId?: string
  container?: ContainerLike
}

type RegisterStepSuccessOptions<T> = Omit<
  WorkflowOrchestratorRunOptions<T>,
  "transactionId" | "input"
>

type RegisterStepFailureOptions<T> = Omit<
  WorkflowOrchestratorRunOptions<T>,
  "transactionId" | "input"
> & {
  forcePermanentFailure?: boolean
}

type RetryStepOptions<T> = Omit<
  WorkflowOrchestratorRunOptions<T>,
  "transactionId" | "input" | "resultFrom"
>

type IdempotencyKeyParts = {
  workflowId: string
  transactionId: string
  stepId: string
  action: "invoke" | "compensate"
}

type WorkflowId = string
type TransactionId = string

type SubscriberHandler = {
  (input: DistributedNotifyOptions): void
} & {
  _id?: string
}

type SubscribeOptions = {
  workflowId: string
  transactionId?: string
  subscriber: SubscriberHandler
  subscriberId?: string
}

type UnsubscribeOptions = {
  workflowId: string
  transactionId?: string
  subscriberOrId: string | SubscriberHandler
}

type TransactionSubscribers = Map<TransactionId, SubscriberHandler[]>
type Subscribers = Map<WorkflowId, TransactionSubscribers>

const AnySubscriber = "any"

export class WorkflowOrchestratorService
  implements IWorkflowModuleOrchestratorService
{
  private static subscribers: Subscribers = new Map()
  private instanceId = ulid()
  protected container_: MedusaContainer
  protected cradle_: Record<string, any>
  protected storage_: IDistributedTransactionStorage &
    IDistributedSchedulerStorage
  protected workflowExecutionService_: ModulesSdkTypes.IMedusaInternalService<any>

  readonly #logger: Logger

  constructor(cradle: {
    sharedContainer: MedusaContainer
    workflowExecutionService: ModulesSdkTypes.IMedusaInternalService<any>
  }) {
    const { sharedContainer, workflowExecutionService } = cradle
    this.cradle_ = cradle
    this.container_ = sharedContainer
    this.workflowExecutionService_ = workflowExecutionService

    this.storage_ = this.cradle_[WORKFLOWS_STORAGE_REGISTRATION_KEY]
    if (typeof this.storage_.setWorkflowOrchestratorService === "function") {
      this.storage_.setWorkflowOrchestratorService(this)
    }

    if (typeof this.storage_.setWorkflowExecutionService === "function") {
      this.storage_.setWorkflowExecutionService(this.workflowExecutionService_)
    }

    DistributedTransaction.setStorage(this.storage_)
    WorkflowScheduler.setStorage(this.storage_)

    this.#logger =
      this.container_.resolve(ContainerRegistrationKeys.LOGGER, {
        allowUnregistered: true,
      }) ?? (console as any)
  }

  __hooks = {
    onApplicationStart: async () => {
      await this.onApplicationStart()
    },
    onApplicationPrepareShutdown: async () => {
      await this.onApplicationPrepareShutdown()
    },
    onApplicationShutdown: async () => {
      await this.onApplicationShutdown()
    },
  }

  private async onApplicationStart() {
    await this.storage_.__hooks?.onApplicationStart?.()
  }

  private async onApplicationPrepareShutdown() {
    await this.storage_.__hooks?.onApplicationPrepareShutdown?.()
  }

  private async onApplicationShutdown() {
    await this.storage_.__hooks?.onApplicationShutdown?.()
  }

  private async triggerParentStep(transaction, result, errors) {
    const metadata = transaction.flow.metadata
    const { parentStepIdempotencyKey, cancelingFromParentStep } = metadata ?? {}

    if (cancelingFromParentStep) {
      /**
       * If the sub workflow is cancelling from a parent step, we don't want to trigger the parent
       * step.
       */
      return
    }

    if (parentStepIdempotencyKey) {
      const hasFailed = [
        TransactionState.REVERTED,
        TransactionState.FAILED,
      ].includes(transaction.flow.state)

      if (hasFailed) {
        await this.setStepFailure({
          idempotencyKey: parentStepIdempotencyKey,
          stepResponse: errors,
          options: {
            logOnError: true,
          },
        })
      } else {
        await this.setStepSuccess({
          idempotencyKey: parentStepIdempotencyKey,
          stepResponse: result,
          options: {
            logOnError: true,
          },
        })
      }
    }
  }

  async run<T = unknown>(
    workflowIdOrWorkflow: string | ReturnWorkflow<any, any, any>,
    options?: WorkflowOrchestratorRunOptions<T>
  ) {
    const {
      input,
      transactionId,
      resultFrom,
      logOnError,
      events: eventHandlers,
      container,
    } = options ?? {}

    let { throwOnError, context } = options ?? {}

    throwOnError ??= true
    context ??= {}
    context.transactionId = transactionId ?? "auto-" + ulid()
    const workflowId = isString(workflowIdOrWorkflow)
      ? workflowIdOrWorkflow
      : workflowIdOrWorkflow.getName()

    if (!workflowId) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Workflow ID is required`
      )
    }

    const events: FlowRunOptions["events"] = this.buildWorkflowEvents({
      customEventHandlers: eventHandlers,
      workflowId,
      transactionId: context.transactionId,
    })

    const exportedWorkflow = MedusaWorkflow.getWorkflow(workflowId)
    if (!exportedWorkflow) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Workflow with id "${workflowId}" not found.`
      )
    }

    const { onFinish, ...restEvents } = events
    const originalOnFinishHandler = events.onFinish!

    const ret = await exportedWorkflow.run({
      input,
      throwOnError: false,
      logOnError,
      resultFrom,
      context,
      events: restEvents,
      container: container ?? this.container_,
    })

    const hasFinished = ret.transaction.hasFinished()
    const metadata = ret.transaction.getFlow().metadata
    const { parentStepIdempotencyKey } = metadata ?? {}

    const hasFailed = [
      TransactionState.REVERTED,
      TransactionState.FAILED,
    ].includes(ret.transaction.getFlow().state)

    const acknowledgement = {
      transactionId: context.transactionId,
      workflowId: workflowId,
      parentStepIdempotencyKey,
      hasFinished,
      hasFailed,
    }

    if (hasFinished) {
      const { result, errors } = ret

      await originalOnFinishHandler({
        transaction: ret.transaction,
        result,
        errors,
      })

      await this.triggerParentStep(ret.transaction, result, errors)
    }

    if (throwOnError && (ret.thrownError || ret.errors?.length)) {
      if (ret.thrownError) {
        throw ret.thrownError
      }

      throw ret.errors[0].error
    }

    return { acknowledgement, ...ret }
  }

  async cancel(
    workflowIdOrWorkflow: string | ReturnWorkflow<any, any, any>,
    options?: WorkflowOrchestratorCancelOptions
  ) {
    const {
      transactionId,
      logOnError,
      events: eventHandlers,
      container,
    } = options ?? {}

    let { throwOnError, context } = options ?? {}

    throwOnError ??= true
    context ??= {}

    const workflowId = isString(workflowIdOrWorkflow)
      ? workflowIdOrWorkflow
      : workflowIdOrWorkflow.getName()

    if (!workflowId) {
      throw new Error("Workflow ID is required")
    }

    if (!transactionId) {
      throw new Error("Transaction ID is required")
    }

    const exportedWorkflow = MedusaWorkflow.getWorkflow(workflowId)
    if (!exportedWorkflow) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Workflow with id "${workflowId}" not found.`
      )
    }

    const transaction = await this.getRunningTransaction(
      workflowId,
      transactionId,
      { ...options, isCancelling: true }
    )
    if (!transaction) {
      if (!throwOnError) {
        return {
          acknowledgement: {
            transactionId,
            workflowId,
            exists: false,
          },
        }
      }
      throw new Error("Transaction not found")
    }

    const events: FlowRunOptions["events"] = this.buildWorkflowEvents({
      customEventHandlers: eventHandlers,
      workflowId,
      transactionId: transactionId,
    })

    const { onFinish, ...restEvents } = events
    const originalOnFinishHandler = events.onFinish!

    const ret = await exportedWorkflow.cancel({
      transaction,
      throwOnError: false,
      logOnError,
      context,
      events: restEvents,
      container: container ?? this.container_,
    })

    const hasFinished = ret.transaction.hasFinished()
    const metadata = ret.transaction.getFlow().metadata
    const { parentStepIdempotencyKey } = metadata ?? {}

    const transactionState = ret.transaction.getFlow().state
    const hasFailed = [TransactionState.FAILED].includes(transactionState)

    const acknowledgement = {
      transactionId: transaction.transactionId,
      workflowId: workflowId,
      parentStepIdempotencyKey,
      hasFinished,
      hasFailed,
      exists: true,
    }

    if (hasFinished) {
      const { result, errors } = ret

      await originalOnFinishHandler({
        transaction: ret.transaction,
        result,
        errors,
      })

      await this.triggerParentStep(ret.transaction, result, errors)
    }

    if (throwOnError && (ret.thrownError || ret.errors?.length)) {
      if (ret.thrownError) {
        throw ret.thrownError
      }

      throw ret.errors[0].error
    }

    return { acknowledgement, ...ret }
  }

  async getRunningTransaction(
    workflowId: string,
    transactionId: string,
    context?: Context
  ): Promise<DistributedTransactionType> {
    if (!workflowId) {
      throw new Error("Workflow ID is required")
    }

    if (!transactionId) {
      throw new Error("TransactionId ID is required")
    }

    context ??= {}

    const exportedWorkflow: any = MedusaWorkflow.getWorkflow(workflowId)
    if (!exportedWorkflow) {
      throw new Error(`Workflow with id "${workflowId}" not found.`)
    }

    const flow = exportedWorkflow()

    const transaction = await flow.getRunningTransaction(transactionId, context)

    return transaction
  }

  async retryStep<T = unknown>({
    idempotencyKey,
    options,
  }: {
    idempotencyKey: string | IdempotencyKeyParts
    options?: RetryStepOptions<T>
  }) {
    const {
      context,
      logOnError,
      container,
      events: eventHandlers,
    } = options ?? {}

    let { throwOnError } = options ?? {}
    throwOnError ??= true

    const [idempotencyKey_, { workflowId, transactionId }] =
      this.buildIdempotencyKeyAndParts(idempotencyKey)

    const exportedWorkflow: any = MedusaWorkflow.getWorkflow(workflowId)
    if (!exportedWorkflow) {
      throw new Error(`Workflow with id "${workflowId}" not found.`)
    }

    const events = this.buildWorkflowEvents({
      customEventHandlers: eventHandlers,
      transactionId,
      workflowId,
    })

    const { onFinish, ...restEvents } = events
    const originalOnFinishHandler = events.onFinish!

    const ret = await exportedWorkflow.retryStep({
      idempotencyKey: idempotencyKey_,
      context,
      throwOnError: false,
      logOnError,
      events: restEvents,
      container: container ?? this.container_,
    })

    if (ret.transaction.hasFinished()) {
      const { result, errors } = ret

      await originalOnFinishHandler({
        transaction: ret.transaction,
        result,
        errors,
      })

      await this.triggerParentStep(ret.transaction, result, errors)
    }

    if (throwOnError && (ret.thrownError || ret.errors?.length)) {
      if (ret.thrownError) {
        throw ret.thrownError
      }

      throw ret.errors[0].error
    }

    return ret
  }

  async setStepSuccess<T = unknown>({
    idempotencyKey,
    stepResponse,
    options,
  }: {
    idempotencyKey: string | IdempotencyKeyParts
    stepResponse: unknown
    options?: RegisterStepSuccessOptions<T>
  }) {
    const {
      context,
      logOnError,
      resultFrom,
      container,
      events: eventHandlers,
    } = options ?? {}

    let { throwOnError } = options ?? {}
    throwOnError ??= true

    const [idempotencyKey_, { workflowId, transactionId }] =
      this.buildIdempotencyKeyAndParts(idempotencyKey)

    const exportedWorkflow: any = MedusaWorkflow.getWorkflow(workflowId)
    if (!exportedWorkflow) {
      throw new Error(`Workflow with id "${workflowId}" not found.`)
    }

    const events = this.buildWorkflowEvents({
      customEventHandlers: eventHandlers,
      transactionId,
      workflowId,
    })

    const { onFinish, ...restEvents } = events
    const originalOnFinishHandler = events.onFinish!

    const ret = await exportedWorkflow.registerStepSuccess({
      idempotencyKey: idempotencyKey_,
      context,
      resultFrom,
      throwOnError: false,
      logOnError,
      events: restEvents,
      response: stepResponse,
      container: container ?? this.container_,
    })

    if (ret.transaction.hasFinished()) {
      const { result, errors } = ret

      await originalOnFinishHandler({
        transaction: ret.transaction,
        result,
        errors,
      })

      await this.triggerParentStep(ret.transaction, result, errors)
    }

    if (throwOnError && (ret.thrownError || ret.errors?.length)) {
      if (ret.thrownError) {
        throw ret.thrownError
      }

      throw ret.errors[0].error
    }

    return ret
  }

  async setStepFailure<T = unknown>({
    idempotencyKey,
    stepResponse,
    options,
  }: {
    idempotencyKey: string | IdempotencyKeyParts
    stepResponse: unknown
    options?: RegisterStepFailureOptions<T>
  }) {
    const {
      context,
      logOnError,
      resultFrom,
      container,
      events: eventHandlers,
      forcePermanentFailure,
    } = options ?? {}

    let { throwOnError } = options ?? {}
    throwOnError ??= true

    const [idempotencyKey_, { workflowId, transactionId }] =
      this.buildIdempotencyKeyAndParts(idempotencyKey)

    const exportedWorkflow: any = MedusaWorkflow.getWorkflow(workflowId)
    if (!exportedWorkflow) {
      throw new Error(`Workflow with id "${workflowId}" not found.`)
    }

    const events = this.buildWorkflowEvents({
      customEventHandlers: eventHandlers,
      transactionId,
      workflowId,
    })

    const { onFinish, ...restEvents } = events
    const originalOnFinishHandler = events.onFinish!

    const ret = await exportedWorkflow.registerStepFailure({
      idempotencyKey: idempotencyKey_,
      context,
      resultFrom,
      throwOnError: false,
      logOnError,
      events: restEvents,
      response: stepResponse,
      container: container ?? this.container_,
      forcePermanentFailure,
    })

    if (ret.transaction.hasFinished()) {
      const { result, errors } = ret

      await originalOnFinishHandler({
        transaction: ret.transaction,
        result,
        errors,
      })

      await this.triggerParentStep(ret.transaction, result, errors)
    }

    if (throwOnError && (ret.thrownError || ret.errors?.length)) {
      if (ret.thrownError) {
        throw ret.thrownError
      }

      throw ret.errors[0].error
    }

    return ret
  }

  subscribe({
    workflowId,
    transactionId,
    subscriber,
    subscriberId,
  }: SubscribeOptions) {
    subscriber._id = subscriberId
    const subscribers =
      WorkflowOrchestratorService.subscribers.get(workflowId) ?? new Map()

    // Subscribe to distributed notifications when first subscriber is added
    if (!WorkflowOrchestratorService.subscribers.has(workflowId)) {
      this.storage_.notificationSubscriber?.subscribe(
        workflowId,
        this.handleDistributedNotification.bind(this)
      )
    }

    const handlerIndex = (handlers) => {
      return handlers.findIndex(
        (s) => s === subscriber || s._id === subscriberId
      )
    }

    if (transactionId) {
      const transactionSubscribers = subscribers.get(transactionId) ?? []
      const subscriberIndex = handlerIndex(transactionSubscribers)
      if (subscriberIndex !== -1) {
        transactionSubscribers.splice(subscriberIndex, 1)
      }

      transactionSubscribers.push(subscriber)
      subscribers.set(transactionId, transactionSubscribers)
      WorkflowOrchestratorService.subscribers.set(workflowId, subscribers)
      return
    }

    const workflowSubscribers = subscribers.get(AnySubscriber) ?? []
    const subscriberIndex = handlerIndex(workflowSubscribers)
    if (subscriberIndex !== -1) {
      workflowSubscribers.splice(subscriberIndex, 1)
    }

    workflowSubscribers.push(subscriber)
    subscribers.set(AnySubscriber, workflowSubscribers)
    WorkflowOrchestratorService.subscribers.set(workflowId, subscribers)
  }

  unsubscribe({
    workflowId,
    transactionId,
    subscriberOrId,
  }: UnsubscribeOptions) {
    const subscribers = WorkflowOrchestratorService.subscribers.get(workflowId)
    if (!subscribers) {
      return
    }

    const filterSubscribers = (handlers: SubscriberHandler[]) => {
      return handlers.filter((handler) => {
        return handler._id
          ? handler._id !== (subscriberOrId as string)
          : handler !== (subscriberOrId as SubscriberHandler)
      })
    }

    if (transactionId) {
      const transactionSubscribers = subscribers.get(transactionId)
      if (transactionSubscribers) {
        const newTransactionSubscribers = filterSubscribers(
          transactionSubscribers
        )

        if (newTransactionSubscribers.length) {
          subscribers.set(transactionId, newTransactionSubscribers)
        } else {
          subscribers.delete(transactionId)
        }
      }
    } else {
      const workflowSubscribers = subscribers.get(AnySubscriber)
      if (workflowSubscribers) {
        const newWorkflowSubscribers = filterSubscribers(workflowSubscribers)

        if (newWorkflowSubscribers.length) {
          subscribers.set(AnySubscriber, newWorkflowSubscribers)
        } else {
          subscribers.delete(AnySubscriber)
        }
      }
    }

    if (subscribers.size === 0) {
      WorkflowOrchestratorService.subscribers.delete(workflowId)
      // Unsubscribe from distributed notifications when last subscriber is removed
      this.storage_.notificationSubscriber?.unsubscribe(workflowId)
    }
  }

  private handleDistributedNotification(
    _workflowId: string,
    data: DistributedNotifyOptions & { instanceId?: string }
  ) {
    // Skip notifications from the same instance to avoid duplicate processing
    if (data.instanceId === this.instanceId) {
      return
    }

    // Process notifications from other instances
    // Only process subscriber notifications, don't re-publish
    setImmediate(() => this.processSubscriberNotifications(data))
  }

  private async notify(options: DistributedNotifyOptions) {
    const { workflowId, isFlowAsync } = options

    // Publish to other instances for async flows
    // Include instanceId so receiving instances can filter out self-notifications
    if (isFlowAsync && this.storage_.notificationSubscriber) {
      setImmediate(async () => {
        try {
          await this.storage_.notificationSubscriber!.publish(
            workflowId,
            {
              ...options,
              instanceId: this.instanceId,
            } as DistributedNotifyOptions
          )
        } catch (error) {
          this.#logger.error(`Failed to publish notification: ${error}`)
        }
      })
    }

    // Process local subscribers asynchronously to avoid blocking workflow execution
    setImmediate(() => this.processSubscriberNotifications(options))
  }

  private async processSubscriberNotifications(options: DistributedNotifyOptions) {
    const { workflowId, transactionId, eventType } = options
    const subscribers: TransactionSubscribers =
      WorkflowOrchestratorService.subscribers.get(workflowId) ?? new Map()

    const notifySubscribersAsync = async (handlers: SubscriberHandler[]) => {
      const promises = handlers.map(async (handler) => {
        try {
          const result = handler(options) as void | Promise<any>
          if (result && typeof result === "object" && "then" in result) {
            await (result as Promise<any>)
          }
        } catch (error) {
          this.#logger.error(`Subscriber error: ${error}`)
        }
      })

      await promiseAll(promises)
    }

    const tasks: Promise<void>[] = []

    if (transactionId) {
      const transactionSubscribers = subscribers.get(transactionId) ?? []
      if (transactionSubscribers.length > 0) {
        tasks.push(notifySubscribersAsync(transactionSubscribers))
      }

      if (eventType === "onFinish") {
        subscribers.delete(transactionId)
      }
    }

    const workflowSubscribers = subscribers.get(AnySubscriber) ?? []
    if (workflowSubscribers.length > 0) {
      tasks.push(notifySubscribersAsync(workflowSubscribers))
    }

    await promiseAll(tasks)
  }

  private buildWorkflowEvents({
    customEventHandlers,
    workflowId,
    transactionId,
  }): DistributedTransactionEvents {
    const notify = async ({
      isFlowAsync,
      eventType,
      step,
      result,
      response,
      errors,
      state,
    }: {
      isFlowAsync: boolean
      eventType: keyof DistributedTransactionEvents
      step?: TransactionStep
      response?: unknown
      result?: unknown
      errors?: unknown[]
      state?: TransactionState
    }) => {
      await this.notify({
        isFlowAsync,
        workflowId,
        transactionId,
        eventType,
        response,
        step,
        result,
        errors,
        state,
      })
    }

    return {
      onTimeout: async ({ transaction }) => {
        customEventHandlers?.onTimeout?.({ transaction })
        await notify({
          eventType: "onTimeout",
          isFlowAsync: transaction.getFlow().hasAsyncSteps,
        })
      },

      onBegin: async ({ transaction }) => {
        customEventHandlers?.onBegin?.({ transaction })
        await notify({
          eventType: "onBegin",
          isFlowAsync: transaction.getFlow().hasAsyncSteps,
        })
      },
      onResume: async ({ transaction }) => {
        customEventHandlers?.onResume?.({ transaction })
        await notify({
          eventType: "onResume",
          isFlowAsync: transaction.getFlow().hasAsyncSteps,
        })
      },
      onCompensateBegin: async ({ transaction }) => {
        customEventHandlers?.onCompensateBegin?.({ transaction })
        await notify({
          eventType: "onCompensateBegin",
          isFlowAsync: transaction.getFlow().hasAsyncSteps,
        })
      },
      onFinish: async ({ transaction, result, errors }) => {
        customEventHandlers?.onFinish?.({ transaction, result, errors })
        await notify({
          eventType: "onFinish",
          isFlowAsync: transaction.getFlow().hasAsyncSteps,
          result,
          errors,
          state: transaction.getFlow().state as TransactionState,
        })
      },

      onStepBegin: async ({ step, transaction }) => {
        customEventHandlers?.onStepBegin?.({ step, transaction })
        await notify({
          eventType: "onStepBegin",
          step,
          isFlowAsync: transaction.getFlow().hasAsyncSteps,
        })
      },
      onStepSuccess: async ({ step, transaction }) => {
        const stepName = step.definition.action!
        const response = await resolveValue(
          transaction.getContext().invoke[stepName],
          transaction
        )
        customEventHandlers?.onStepSuccess?.({ step, transaction, response })
        await notify({
          eventType: "onStepSuccess",
          step,
          response,
          isFlowAsync: transaction.getFlow().hasAsyncSteps,
        })
      },
      onStepFailure: async ({ step, transaction }) => {
        const stepName = step.definition.action!
        const errors = transaction
          .getErrors(TransactionHandlerType.INVOKE)
          .filter((err) => err.action === stepName)

        customEventHandlers?.onStepFailure?.({ step, transaction, errors })
        await notify({
          eventType: "onStepFailure",
          step,
          errors,
          isFlowAsync: transaction.getFlow().hasAsyncSteps,
        })
      },
      onStepAwaiting: async ({ step, transaction }) => {
        customEventHandlers?.onStepAwaiting?.({ step, transaction })

        await notify({
          eventType: "onStepAwaiting",
          step,
          isFlowAsync: transaction.getFlow().hasAsyncSteps,
        })
      },

      onCompensateStepSuccess: async ({ step, transaction }) => {
        const stepName = step.definition.action!
        const response = transaction.getContext().compensate[stepName]
        customEventHandlers?.onCompensateStepSuccess?.({
          step,
          transaction,
          response,
        })

        await notify({
          eventType: "onCompensateStepSuccess",
          step,
          response,
          isFlowAsync: transaction.getFlow().hasAsyncSteps,
        })
      },
      onCompensateStepFailure: async ({ step, transaction }) => {
        const stepName = step.definition.action!
        const errors = transaction
          .getErrors(TransactionHandlerType.COMPENSATE)
          .filter((err) => err.action === stepName)

        customEventHandlers?.onStepFailure?.({ step, transaction, errors })

        await notify({
          eventType: "onCompensateStepFailure",
          step,
          errors,
          isFlowAsync: transaction.getFlow().hasAsyncSteps,
        })
      },
    }
  }

  private buildIdempotencyKeyAndParts(
    idempotencyKey: string | IdempotencyKeyParts
  ): [string, IdempotencyKeyParts] {
    const parts: IdempotencyKeyParts = {
      workflowId: "",
      transactionId: "",
      stepId: "",
      action: "invoke",
    }
    let idempotencyKey_ = idempotencyKey as string

    const setParts = (workflowId, transactionId, stepId, action) => {
      parts.workflowId = workflowId
      parts.transactionId = transactionId
      parts.stepId = stepId
      parts.action = action
    }

    if (!isString(idempotencyKey)) {
      const { workflowId, transactionId, stepId, action } =
        idempotencyKey as IdempotencyKeyParts
      idempotencyKey_ = [workflowId, transactionId, stepId, action].join(":")
      setParts(workflowId, transactionId, stepId, action)
    } else {
      const [workflowId, transactionId, stepId, action] =
        idempotencyKey_.split(":")
      setParts(workflowId, transactionId, stepId, action)
    }

    return [idempotencyKey_, parts]
  }
}
