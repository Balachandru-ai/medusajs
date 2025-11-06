export function formatError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.message}: ${err.stack}`
  }
  
  if (typeof err === 'object' && err !== null) {
    try {
      return JSON.stringify(err)
    } catch (e) {
      return String(err)
    }
  }
  
  return String(err)
}