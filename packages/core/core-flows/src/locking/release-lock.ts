import { isDefined, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

/**
 * The locked keys to be released
 */
export interface ReleaseLockStepInput {
  key: string | string[]
  ownerId?: string
  provider?: string
  skipOnSubWorkflow?: boolean
}

export const releaseLockStepId = "release-lock-step"
/**
 * This step releases a lock for a given key.
 *
 * @example
 * const data = releaseLockStep({
 *   "key": "my-lock-key"
 * })
 */
export const releaseLockStep = createStep(
  releaseLockStepId,
  async (
    data: ReleaseLockStepInput,
    { container, parentStepIdempotencyKey }
  ) => {
    const keys = Array.isArray(data.key)
      ? data.key
      : isDefined(data.key)
      ? [data.key]
      : []

    if (!keys.length) {
      return new StepResponse(true)
    }

    const isSubWorkflow = !!parentStepIdempotencyKey
    if (isSubWorkflow && data.skipOnSubWorkflow) {
      return StepResponse.skip() as any
    }

    const ownerId = data.ownerId
    const locking = container.resolve(Modules.LOCKING)
    const released = await locking.release(keys, {
      ownerId,
      provider: data.provider,
    })

    return new StepResponse(released)
  }
)
