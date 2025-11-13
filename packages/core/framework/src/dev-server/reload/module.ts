import type { CustomModuleMetadata } from "../types"

/**
 * Reload a single module file
 */
export async function reloadModule(
  filePath: string,
  viteServer: any
): Promise<void> {
  console.log(`[HMR] Reloading module: ${filePath}`)

  // Get ModuleLoader instance from global
  const moduleLoader = (global as any).__MEDUSA_HMR_MODULE_LOADER__
  if (!moduleLoader) {
    console.error(`[HMR] ModuleLoader not available - cannot reload modules`)
    return
  }

  try {
    // Step 1: Unregister old modules
    const existed = await moduleLoader.unregister(filePath)
    if (!existed) {
      console.log(`[HMR] New module file detected: ${filePath}`)
    }

    // Step 2: Invalidate module in Vite's module graph
    const module = viteServer.moduleGraph.getModuleById(filePath)
    if (module) {
      viteServer.moduleGraph.invalidateModule(module)
    }

    // Step 3: Clear from Node.js require cache
    delete require.cache[filePath]
    if (require.cache[require.resolve(filePath)]) {
      delete require.cache[require.resolve(filePath)]
    }

    // Step 4: Reload and re-register the module through ModuleLoader
    const modules: CustomModuleMetadata[] = await moduleLoader.reloadModule(filePath)

    console.log(
      `[HMR] ✅ Module reloaded successfully: ${modules.length} module(s) from ${filePath}`
    )

    // Show which modules were reloaded
    modules.forEach((moduleItem: CustomModuleMetadata) => {
      console.log(`[HMR]    ${moduleItem.meta.moduleKey || moduleItem.meta.serviceName || 'unnamed module'}`)
    })
  } catch (error) {
    console.error(`[HMR] ❌ Failed to reload module ${filePath}:`, error)
    console.error(`[HMR] You may need to restart the server`)
  }
}
