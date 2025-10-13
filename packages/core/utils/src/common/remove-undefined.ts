import { parseStringifyIfNecessary } from "./parse-stringify-if-necessary"

// useful in cases where presence of undefined is not desired (eg. in microORM operations)
export const removeUndefined = async <T extends Record<string, any>>(
  obj: T
): Promise<T> => {
  return parseStringifyIfNecessary(obj) as Promise<T>
}
