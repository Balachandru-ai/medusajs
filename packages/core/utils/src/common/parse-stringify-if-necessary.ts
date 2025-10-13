import { isDefined } from "./is-defined"
import bfj from "bfj"

/**
 * Only apply JSON.parse JSON.stringify when we have objects, arrays, dates, etc..
 * @param result
 * @returns
 */
export async function parseStringifyIfNecessary(result: unknown) {
  if (typeof result == null || typeof result !== "object") {
    return result
  }

  const strResult = await bfj.stringify(result)

  if (isDefined(strResult)) {
    return JSON.parse(strResult)
  }
  return result
}
