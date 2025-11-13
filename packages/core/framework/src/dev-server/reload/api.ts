/**
 * Reload a single route file
 */
export async function reloadRoute(
  filePath: string,
  app: any,
  registry: any,
  viteServer: any
): Promise<void> {
  console.log(`[HMR] Reloading route: ${filePath}`)

  // Get ApiLoader instance from global
  const apiLoader = (global as any).__MEDUSA_HMR_API_LOADER__
  if (!apiLoader) {
    console.error(`[HMR] ApiLoader not available - cannot reload routes`)
    return
  }

  try {
    // Step 1: Unregister old routes from Express
    const existed = await registry.unregister(filePath, app)
    if (!existed) {
      console.log(`[HMR] New route file detected: ${filePath}`)
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

    // Step 4 & 5: Reload and re-register the route through ApiLoader
    const routes = await apiLoader.reloadRoute(filePath)

    console.log(
      `[HMR] ✅ Route reloaded successfully: ${routes.length} route(s) from ${filePath}`
    )

    // Show which routes were reloaded
    routes.forEach((route: any) => {
      console.log(`[HMR]    ${route.method} ${route.matcher}`)
    })
  } catch (error) {
    console.error(`[HMR] ❌ Failed to reload route ${filePath}:`, error)
    console.error(`[HMR] You may need to restart the server`)
  }
}
