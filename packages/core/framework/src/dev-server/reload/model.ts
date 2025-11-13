/**
 * Reload a single model file
 */
export async function reloadModel(
  filePath: string,
  viteServer: any
): Promise<void> {
  console.log(`[HMR] Reloading model: ${filePath}`)

  try {
    // reload model
    // refresh remote query
    // refresh index module
  } catch (error) {
    console.error(`[HMR] ❌ Failed to reload model ${filePath}:`, error)
  }
}
