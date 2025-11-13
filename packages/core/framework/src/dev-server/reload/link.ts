/**
 * Reload a single link file
 */
export async function reloadLink(
  filePath: string,
  viteServer: any
): Promise<void> {
  console.log(`[HMR] Reloading link: ${filePath}`)

  try {
    // reload link
    // refresh remote query
    // refresh index module
  } catch (error) {
    console.error(`[HMR] ❌ Failed to reload link ${filePath}:`, error)
  }
}
