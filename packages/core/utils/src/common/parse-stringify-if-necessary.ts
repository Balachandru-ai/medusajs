import { isDefined } from "./is-defined"

/**
 * Only apply JSON.parse JSON.stringify when we have objects, arrays, dates, etc..
 * @param result
 * @returns
 */
export function parseStringifyIfNecessary(result: unknown) {
  if (typeof result == null || typeof result !== "object") {
    return result
  }

  const strResult = JSON.stringify(result)
  if (isDefined(strResult)) {
    return JSON.parse(strResult)
  }
  return result
}
