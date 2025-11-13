import { createHmrPlugin } from "./hmr-plugin"
import { createLinkRegistry } from "./link-registry"
import { createModuleRegistry } from "./module-registry"
import { reloadRoute } from "./reload/api"
import { reloadLink } from "./reload/link"
import { reloadModule } from "./reload/module"
import { reloadStep, reloadWorkflow } from "./reload/workflow"
import { createRouteRegistry } from "./route-registry"
import type { DevServerConfig, DevServerInstance, HmrUpdate } from "./types"
import { createViteConfig } from "./vite-config"
import { createWorkflowRegistry } from "./workflow-registry"

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

  // Create registries for tracking Medusa components
  const routeRegistry = createRouteRegistry()

  const workflowRegistry = createWorkflowRegistry()
  const linkRegistry = createLinkRegistry()
  const registry = createModuleRegistry()

  // Define search directories for dependency tracking
  const searchDirs = [config.root]

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
    const now = Date.now()
    const lastReload = reloadDebounceMap.get(update.path)
    if (lastReload && now - lastReload < DEBOUNCE_MS) {
      return
    }
    reloadDebounceMap.set(update.path, now)
    const startTime = Date.now()

    if (config.verbose) {
      console.log(`[HMR] ${update.type}: ${update.path}`)
      console.log(`[HMR] Affected paths: ${update.affectedPaths?.length || 1}`)

      if (config.verbose && update.affectedPaths) {
        console.log(`[HMR] Affected paths: ${update.affectedPaths.join(", ")}`)
      }
    }

    // Include the changed path itself
    const pathsToReload = update.affectedPaths
      ? [update.path, ...update.affectedPaths.filter((p) => p !== update.path)]
      : [update.path]

    for (const path of pathsToReload) {
      const fileType = determineFileType(path)

      if (instance.app) {
        try {
          switch (fileType) {
            case "route":
              await reloadRoute(path, instance.app, routeRegistry, vite)
              break
            case "workflow":
              await reloadWorkflow(path, vite, searchDirs)
              break
            case "step":
              await reloadStep(path, vite, searchDirs)
              break
            case "link":
              await reloadLink(path, vite)
              break
            case "module":
              await reloadModule(path, vite)
              break
            default:
              if (config.verbose) {
                console.log(
                  `[HMR] Skipping unsupported file type: ${fileType} for ${path}`
                )
              }
          }
        } catch (error) {
          console.error(`[HMR] Failed to reload ${fileType} ${path}:`, error)
        }
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
   * Determine the type of file based on its path
   */
  function determineFileType(filePath: string): string {
    if (
      filePath.includes("/workflows/") &&
      (filePath.endsWith(".ts") || filePath.endsWith(".js"))
    ) {
      if (filePath.includes("/steps/")) {
        return "step"
      }
      return "workflow"
    }

    if (
      filePath.includes("/links/") &&
      (filePath.endsWith(".ts") || filePath.endsWith(".js"))
    ) {
      return "link"
    }

    if (
      filePath.includes("/modules/") &&
      (filePath.endsWith(".ts") || filePath.endsWith(".js"))
    ) {
      return "module"
    }

    if (
      filePath.includes("/route.") &&
      (filePath.endsWith(".ts") || filePath.endsWith(".js"))
    ) {
      return "route"
    }

    return "unknown"
  }

  // Create HMR plugin
  // MODIFIED: No longer pass registry to plugin, as affected paths are now computed using Vite's ModuleGraph directly
  const hmrPlugin = createHmrPlugin(handleHmrUpdate)

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
    workflowRegistry,
    linkRegistry,

    async start() {
      console.log("[HMR] Dev server started with hot module replacement")
      console.log("[HMR] Watching for file changes...")

      // Log route statistics
      const routeStats = routeRegistry.getStats()
      console.log(
        `[HMR] Tracking ${routeStats.totalRoutes} routes from ${routeStats.totalFiles} files`
      )

      // Log workflow statistics
      const workflowStats = workflowRegistry.getStats()
      console.log(
        `[HMR] Tracking ${workflowStats.totalWorkflows} workflows from ${workflowStats.totalFiles} files`
      )

      // Log link statistics
      const linkStats = linkRegistry.getStats()
      console.log(
        `[HMR] Tracking ${linkStats.totalLinks} links from ${linkStats.totalFiles} files`
      )

      // Log module statistics
      const moduleStats = registry.getStats()
      console.log(
        `[HMR] Tracking ${moduleStats.totalModules} custom modules from ${moduleStats.totalFiles} files`
      )
    },

    async stop() {
      console.log("[HMR] Stopping dev server...")
      await vite.close()
      registry.clear()
      routeRegistry.clear()
      workflowRegistry.clear()
      linkRegistry.clear()
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

// Export types and utilities
export { createHmrPlugin } from "./hmr-plugin"
export { createLinkRegistry } from "./link-registry"
export { createModuleRegistry } from "./module-registry"
export { createRouteRegistry } from "./route-registry"
export * from "./types"
export { createViteConfig } from "./vite-config"
export { createWorkflowRegistry } from "./workflow-registry"
