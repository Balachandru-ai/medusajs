/**
 * Execute functions with a concurrency limit
 * @param functions Array of functions to execute in parallel
 * @param concurrency Maximum number of concurrent executions
 */
export async function executeWithConcurrency<T>(
  functions: (() => Promise<T>)[],
  concurrency: number
): Promise<PromiseSettledResult<Awaited<T>>[]> {
  const results: PromiseSettledResult<Awaited<T>>[] = new Array(
    functions.length
  )
  let currentIndex = 0

  const executeNext = async (): Promise<void> => {
    while (currentIndex < functions.length) {
      const index = currentIndex++
      const result = await Promise.allSettled([functions[index]()])
      results[index] = result[0]
    }
  }

  const workers: Promise<void>[] = []
  for (let i = 0; i < concurrency; i++) {
    workers.push(executeNext())
  }

  await Promise.all(workers)

  return results
}
