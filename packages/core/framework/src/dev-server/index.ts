import { createViteConfig } from "./vite-config"
import { createHmrPlugin } from "./hmr-plugin"
import { createModuleRegistry } from "./module-registry"
import { createRouteRegistry } from "./route-registry"
import type {
  DevServerConfig,
  DevServerInstance,
  HmrUpdate,
} from "./types"

// Use any type for Vite to avoid build-time dependency
type ViteDevServer = any

/**
 * Create a Vite-powered dev server with HMR for Medusa backend
 * This is the main entry point for Phase 1 of the HMR implementation
 */
export async function createDevServer(
  config: DevServerConfig
): Promise<DevServerInstance> {
  const { createServer } = await import("vite")

  // Create module registry for tracking loaded modules
  const registry = createModuleRegistry()

  // Create route registry for tracking routes specifically
  const routeRegistry = createRouteRegistry()

  // Track HMR statistics
  let reloadCount = 0
  let lastReloadTime = 0

  // Debounce map to prevent duplicate reloads
  // Key: file path, Value: timestamp of last reload
  const reloadDebounceMap = new Map<string, number>()
  const DEBOUNCE_MS = 100 // Ignore reloads within 100ms of each other

  /**
   * Handle HMR updates
   * This callback is triggered when files change
   */
  async function handleHmrUpdate(update: HmrUpdate): Promise<void> {
    // Debounce: check if we recently reloaded this file
    const now = Date.now()
    const lastReload = reloadDebounceMap.get(update.path)
    if (lastReload && now - lastReload < DEBOUNCE_MS) {
      if (config.verbose) {
        console.log(`[HMR] Ignoring duplicate event for ${update.path}`)
      }
      return
    }
    reloadDebounceMap.set(update.path, now)
    const startTime = Date.now()

    if (config.verbose) {
      console.log(`[HMR] ${update.type}: ${update.path}`)
      console.log(
        `[HMR] Affected modules: ${update.affectedModules.length}`
      )
    }

    // Check if this is a route file
    const isRouteFile = update.path.includes("/route.") &&
      (update.path.endsWith(".ts") || update.path.endsWith(".js"))

    if (isRouteFile && instance.app) {
      try {
        await reloadRoute(update.path, instance.app, routeRegistry, vite)
      } catch (error) {
        console.error(`[HMR] Failed to reload route ${update.path}:`, error)
      }
    }

    lastReloadTime = Date.now() - startTime
    reloadCount++

    console.log(
      `[HMR] Update completed in ${lastReloadTime}ms (total reloads: ${reloadCount})`
    )

    // Cleanup old debounce entries (older than 5 seconds)
    const cleanupThreshold = now - 5000
    for (const [path, timestamp] of reloadDebounceMap.entries()) {
      if (timestamp < cleanupThreshold) {
        reloadDebounceMap.delete(path)
      }
    }
  }

  /**
   * Reload a single route file
   */
  async function reloadRoute(
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

  // Create HMR plugin
  const hmrPlugin = createHmrPlugin(registry, handleHmrUpdate)

  // Create Vite config
  const viteConfig = await createViteConfig(config, hmrPlugin)

  // Create Vite dev server
  const vite = await createServer(viteConfig)

  // Start Vite's file watcher
  await vite.listen()

  console.log(
    `[HMR] Vite dev server initialized (experimental backend HMR enabled)`
  )

  /**
   * Dev server instance API
   */
  const instance: DevServerInstance = {
    vite,
    app: null as any, // Will be set by the caller
    registry,
    routeRegistry,

    async start() {
      console.log("[HMR] Dev server started with hot module replacement")
      console.log("[HMR] Watching for file changes...")

      // Log route statistics
      const stats = routeRegistry.getStats()
      console.log(`[HMR] Tracking ${stats.totalRoutes} routes from ${stats.totalFiles} files`)
    },

    async stop() {
      console.log("[HMR] Stopping dev server...")
      await vite.close()
      registry.clear()
      routeRegistry.clear()
    },

    async reload(filePaths: string[]) {
      // Manual reload trigger (can be used via CLI or API)
      for (const filePath of filePaths) {
        const module = vite.moduleGraph.getModuleById(filePath)
        if (module) {
          vite.moduleGraph.invalidateModule(module)
        }

        // Clear from Node.js require cache
        delete require.cache[filePath]
      }

      console.log(`[HMR] Manually reloaded ${filePaths.length} module(s)`)
    },
  }

  return instance
}

/**
 * Load a module through Vite's SSR loader
 * This enables hot reloading for the module
 */
export async function loadModule<T = any>(
  vite: ViteDevServer,
  filePath: string
): Promise<T> {
  // Use Vite's SSR load module
  // This goes through Vite's transform pipeline and tracks dependencies
  const module = await vite.ssrLoadModule(filePath)
  return module
}

/**
 * Invalidate a module and clear it from all caches
 */
export async function invalidateModule(
  vite: ViteDevServer,
  filePath: string
): Promise<void> {
  const module = vite.moduleGraph.getModuleById(filePath)

  if (module) {
    // Invalidate in Vite's module graph
    vite.moduleGraph.invalidateModule(module)
  }

  // Clear from Node.js require cache
  delete require.cache[filePath]
  delete require.cache[require.resolve(filePath)]
}

/**
 * Check if backend HMR is enabled
 * This checks the feature flag
 */
export function isBackendHmrEnabled(container: any): boolean {
  try {
    const featureFlags = container.resolve("featureFlagRouter")
    return featureFlags.isFeatureEnabled("backend_hmr")
  } catch (error) {
    // Feature flag router not available or flag not found
    return false
  }
}

// Export types and utilities
export * from "./types"
export { createModuleRegistry } from "./module-registry"
export { createRouteRegistry } from "./route-registry"
export { createViteConfig } from "./vite-config"
export { createHmrPlugin } from "./hmr-plugin"
