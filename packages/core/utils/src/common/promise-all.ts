import { EOL } from "os"

const getMessageError = (state: PromiseRejectedResult) =>
  state.reason.message ?? state.reason

const isRejected = (
  state: PromiseSettledResult<unknown>
): state is PromiseRejectedResult => {
  return state.status === "rejected"
}

const getValue = (state: PromiseFulfilledResult<unknown>) => state.value

/**
 * Execute promises with a concurrency limit
 * @param promises Array of promise factories or promises
 * @param concurrency Maximum number of concurrent executions
 */
async function executeWithConcurrency<T>(
  promises: readonly T[],
  concurrency: number
): Promise<PromiseSettledResult<Awaited<T>>[]> {
  const results: PromiseSettledResult<Awaited<T>>[] = new Array(promises.length)
  let index = 0

  const executing = new Set<Promise<void>>()

  while (index < promises.length) {
    const promiseIndex = index++
    const execution = (promises[promiseIndex] as Promise<T>).then(() => {
      executing.delete(execution)
    })

    executing.add(execution)

    if (executing.size >= concurrency) {
      await Promise.race(executing)
    }
  }

  await promiseAll(Array.from(executing))

  return results
}

/**
 * Promise.allSettled with error handling, safe alternative to Promise.all
 * @param promises
 * @param options.aggregateErrors If true, aggregate all errors into a single error message
 * @param options.concurrency If set, limit concurrent execution to this number
 */
export async function promiseAll<T extends readonly unknown[] | []>(
  promises: T,
  {
    aggregateErrors,
    concurrency,
  }: { aggregateErrors?: boolean; concurrency?: number } = {}
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
  if (!promises.length) {
    return [] as unknown as Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>
  }

  let states: PromiseSettledResult<unknown>[]

  if (concurrency && concurrency > 0 && concurrency < promises.length) {
    states = await executeWithConcurrency(promises, concurrency)
  } else {
    states = (await Promise.allSettled(
      promises
    )) as PromiseSettledResult<unknown>[]
  }

  const rejected = states.filter(isRejected)

  if (rejected.length) {
    if (aggregateErrors) {
      throw new Error(rejected.map(getMessageError).join(EOL))
    }

    throw rejected[0].reason // Re throw the error itself
  }

  return (states as PromiseFulfilledResult<unknown>[]).map(
    getValue
  ) as unknown as Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>
}
