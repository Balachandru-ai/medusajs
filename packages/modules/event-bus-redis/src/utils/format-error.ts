export function formatError(err: unknown): string {
  if (err instanceof Error) {
    return err.stack || String(err)
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