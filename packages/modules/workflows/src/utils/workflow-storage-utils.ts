import { raw } from "@medusajs/framework/mikro-orm/core"
import {
  SkipCancelledExecutionError,
  SkipExecutionError,
  SkipStepAlreadyFinishedError,
  TransactionCheckpoint,
  TransactionOptions,
  TransactionStep,
} from "@medusajs/framework/orchestration"
import { ModulesSdkTypes } from "@medusajs/framework/types"
import {
  isPresent,
  TransactionState,
  TransactionStepState,
} from "@medusajs/framework/utils"

export const doneStates = new Set([
  TransactionStepState.DONE,
  TransactionStepState.REVERTED,
  TransactionStepState.FAILED,
  TransactionStepState.SKIPPED,
  TransactionStepState.SKIPPED_FAILURE,
  TransactionStepState.TIMEOUT,
])

export const finishedStates = new Set([
  TransactionState.DONE,
  TransactionState.FAILED,
  TransactionState.REVERTED,
])

export const failedStates = new Set([
  TransactionState.FAILED,
  TransactionState.REVERTED,
])

/**
 * Determines whether a checkpoint should be saved to the database based on the current transaction state.
 */
export function shouldSaveToDb(data: TransactionCheckpoint): boolean {
  const isNotStarted = data.flow.state === TransactionState.NOT_STARTED
  const asyncVersion = data.flow._v
  const isFinished = finishedStates.has(data.flow.state)
  const isWaitingToCompensate =
    data.flow.state === TransactionState.WAITING_TO_COMPENSATE

  const isFlowInvoking = data.flow.state === TransactionState.INVOKING

  const stepsArray = Object.values(data.flow.steps) as TransactionStep[]
  let currentStep: TransactionStep | undefined

  const targetStates = isFlowInvoking
    ? new Set([
        TransactionStepState.INVOKING,
        TransactionStepState.DONE,
        TransactionStepState.FAILED,
      ])
    : new Set([TransactionStepState.COMPENSATING])

  for (let i = stepsArray.length - 1; i >= 0; i--) {
    const step = stepsArray[i]

    if (step.id === "_root") {
      break
    }

    const isTargetState = targetStates.has(step.invoke?.state)

    if (isTargetState && !currentStep) {
      currentStep = step
      break
    }
  }

  let shouldStoreCurrentSteps = false
  if (currentStep) {
    for (const step of stepsArray) {
      if (step.id === "_root") {
        continue
      }

      if (
        step.depth === currentStep.depth &&
        step?.definition?.store === true
      ) {
        shouldStoreCurrentSteps = true
        break
      }
    }
  }

  return (
    isNotStarted ||
    isFinished ||
    isWaitingToCompensate ||
    shouldStoreCurrentSteps ||
    !!asyncVersion
  )
}

/**
 * Saves a transaction checkpoint to the database.
 */
export async function saveToDb(
  workflowExecutionService: ModulesSdkTypes.IMedusaInternalService<any>,
  data: TransactionCheckpoint,
  retentionTime?: number
): Promise<void> {
  if (!shouldSaveToDb(data)) {
    return
  }

  await workflowExecutionService.upsert([
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

/**
 * Deletes a transaction checkpoint from the database.
 */
export async function deleteFromDb(
  workflowExecutionService: ModulesSdkTypes.IMedusaInternalService<any>,
  data: TransactionCheckpoint
): Promise<void> {
  await workflowExecutionService.delete([
    {
      run_id: data.flow.runId,
    },
  ])
}

/**
 * Clears expired workflow executions from the database.
 */
export async function clearExpiredExecutions(
  workflowExecutionService: ModulesSdkTypes.IMedusaInternalService<any>
): Promise<void> {
  await workflowExecutionService.delete({
    retention_time: {
      $ne: null,
    },
    updated_at: {
      $lte: raw(
        (_alias) =>
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

/**
 * Options for race condition prevention.
 */
export type PreventRaceConditionOptions = {
  data: TransactionCheckpoint
  options?: TransactionOptions
  getStoredData: () => Promise<TransactionCheckpoint | undefined>
  cachedData?: TransactionCheckpoint
}

/**
 * Prevents race condition execution by checking if a concurrent execution has already finished
 * or if the transaction has been cancelled.
 */
export async function preventRaceConditionExecutionIfNecessary({
  data,
  options,
  getStoredData,
  cachedData,
}: PreventRaceConditionOptions): Promise<void> {
  const isInitialCheckpoint = [TransactionState.NOT_STARTED].includes(
    data.flow.state
  )
  const currentFlow = data.flow

  let data_: TransactionCheckpoint =
    cachedData ?? ({ flow: {} } as TransactionCheckpoint)

  if (!cachedData) {
    data_ = (await getStoredData()) ?? ({ flow: {} } as TransactionCheckpoint)
  }

  const { flow: latestUpdatedFlow } = data_

  if (options?.stepId) {
    const stepId = options.stepId
    const currentStep = data.flow.steps[stepId]
    const latestStep = latestUpdatedFlow.steps?.[stepId]
    if (latestStep && currentStep) {
      const isCompensating = data.flow.state === TransactionState.COMPENSATING

      const latestState = isCompensating
        ? latestStep.compensate?.state
        : latestStep.invoke?.state

      const shouldSkip = doneStates.has(latestState)

      if (shouldSkip) {
        throw new SkipStepAlreadyFinishedError(
          `Step ${stepId} already finished by another execution`
        )
      }
    }
  }

  if (
    !isInitialCheckpoint &&
    !isPresent(latestUpdatedFlow) &&
    !data.flow.metadata?.parentStepIdempotencyKey
  ) {
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
