import { isDefined } from "./is-defined"
import bfj from "bfj"

/**
 * Fast heuristic to estimate if an object is large enough to warrant async serialization.
 * Uses shallow inspection to avoid blocking the event loop during the check itself.
 */
function shouldUseAsyncStringify(obj: unknown, maxDepth = 2): boolean {
  const PROPERTY_THRESHOLD = 50 // Max properties before going async
  const ARRAY_THRESHOLD = 100 // Max array length before going async

  let propertyCount = 0
  const visited = new WeakSet()

  function countProperties(value: any, depth: number): boolean {
    // Stop if we've exceeded threshold or max depth
    if (propertyCount > PROPERTY_THRESHOLD || depth > maxDepth) {
      return true // Use async
    }

    // Avoid circular references
    if (value && typeof value === "object") {
      if (visited.has(value)) {
        return false
      }
      visited.add(value)
    }

    if (Array.isArray(value)) {
      propertyCount += value.length
      if (value.length > ARRAY_THRESHOLD) {
        return true // Large array, use async
      }

      // Sample first few elements if array is large
      const sampleSize = Math.min(value.length, 10)
      for (let i = 0; i < sampleSize; i++) {
        if (countProperties(value[i], depth + 1)) {
          return true
        }
      }
    } else if (
      value &&
      typeof value === "object" &&
      value.constructor === Object
    ) {
      const keys = Object.keys(value)
      propertyCount += keys.length

      if (propertyCount > PROPERTY_THRESHOLD) {
        return true // Too many properties, use async
      }

      // Check nested properties
      for (const key of keys) {
        if (countProperties(value[key], depth + 1)) {
          return true
        }
      }
    }

    return false
  }

  return countProperties(obj, 0)
}

/**
 * Only apply JSON.parse JSON.stringify when we have objects, arrays, dates, etc..
 * Automatically chooses sync or async stringify based on object size.
 * @param result
 * @returns
 */
export async function parseStringifyIfNecessary(result: unknown) {
  if (typeof result == null || typeof result !== "object") {
    return result
  }

  // Use heuristic to decide sync vs async
  const useAsync = shouldUseAsyncStringify(result)

  const strResult = useAsync
    ? await bfj.stringify(result, {
        promises: "ignore",
        buffers: "ignore",
        circular: "ignore",
        yieldRate: 65536, // Higher = faster but longer blocking chunks (default: 1024)
      })
    : JSON.stringify(result)

  if (isDefined(strResult)) {
    return JSON.parse(strResult)
  }
  return result
}
