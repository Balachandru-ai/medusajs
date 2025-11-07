import { isObject } from "@medusajs/framework/utils"

export function formatError(err: unknown): string {
  if (err instanceof Error) {
    return err.stack || String(err)
  }
  
  if (isObject(err)) {
    try {
      return JSON.stringify(err)
    } catch (e) {
      return String(err)
    }
  }
  
  return String(err)
}