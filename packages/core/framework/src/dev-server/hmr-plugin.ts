import type { ModuleRegistry, HmrUpdate } from "./types"
import path from "path"

// Use any types for Vite to avoid build-time dependency
type Plugin = any
type ViteDevServer = any
type ModuleNode = any

/**
 * Vite plugin for backend HMR
 * Tracks module changes and dependencies, and triggers selective reloads
 */
export function createHmrPlugin(
  registry: ModuleRegistry,
  onUpdate: (update: HmrUpdate) => Promise<void>
): Plugin {
  return {
    name: "medusa:backend-hmr",

    /**
     * Called when Vite dev server is created
     */
    configureServer(server) {

      // Listen to Vite's HMR updates
      server.watcher.on("all", async (event, filePath) => {
        // Normalize the file path
        const normalizedPath = path.normalize(filePath)

        // Only process add, change, unlink events
        if (!["add", "change", "unlink"].includes(event)) {
          return
        }

        // Skip if not a source file
        if (!isSourceFile(normalizedPath)) {
          return
        }

        // Get the module from Vite's module graph
        const module = server.moduleGraph.getModuleById(normalizedPath)

        // Find all affected modules (the changed file + its dependents)
        const affectedModules = getAffectedModules(normalizedPath, registry)

        // Invalidate modules in Vite's module graph
        if (module) {
          await invalidateModule(module, server)
        }

        // Trigger the update callback
        const update: HmrUpdate = {
          type: event as "add" | "change" | "unlink",
          path: normalizedPath,
          affectedModules,
          timestamp: Date.now(),
        }

        await onUpdate(update)
      })
    },

    /**
     * Handle hot update
     * This is called by Vite when a module changes
     */
    async handleHotUpdate({ file, modules, server }) {
      // For backend, we handle updates through the watcher above
      // Return empty array to prevent default HMR behavior (WebSocket updates)
      return []
    },

    /**
     * Transform hook - track dependencies
     * This runs for every module that gets loaded
     */
    async transform(code, id) {
      // Track dependencies for this module
      // Vite's module graph handles this, but we might need custom tracking later
      return null
    },
  }
}

/**
 * Check if a file is a source file that should trigger HMR
 */
function isSourceFile(filePath: string): boolean {
  const ext = path.extname(filePath)
  const sourceExts = [".ts", ".js", ".tsx", ".jsx", ".mjs", ".cjs"]

  if (!sourceExts.includes(ext)) {
    return false
  }

  // Exclude certain paths
  const excludePatterns = [
    "/node_modules/",
    "/.git/",
    "/dist/",
    "/.medusa/",
    "/src/admin/", // Admin has its own HMR
  ]

  return !excludePatterns.some((pattern) => filePath.includes(pattern))
}

/**
 * Get all modules affected by a change to the given file
 * This includes the file itself and all modules that depend on it
 */
function getAffectedModules(
  filePath: string,
  registry: ModuleRegistry
): any[] {
  const affected: any[] = []

  // Add the file itself if it's tracked
  const module = registry.get(filePath)
  if (module) {
    affected.push(module)
  }

  // Add all dependents recursively
  const dependents = registry.getDependents(filePath)
  for (const dependent of dependents) {
    affected.push(dependent)
    // Recursively get dependents of dependents
    const nestedDependents = getAffectedModules(dependent.filePath, registry)
    affected.push(...nestedDependents)
  }

  // Remove duplicates
  return Array.from(new Set(affected))
}

/**
 * Invalidate a module and all its dependents in Vite's module graph
 */
async function invalidateModule(
  module: ModuleNode,
  server: ViteDevServer
): Promise<void> {
  // Invalidate the module
  server.moduleGraph.invalidateModule(module)

  // Clear from Node.js require cache
  if (module.file) {
    delete require.cache[require.resolve(module.file)]
  }

  // Invalidate all importers (modules that import this one)
  for (const importer of module.importers) {
    await invalidateModule(importer, server)
  }
}

/**
 * Build dependency graph from Vite's module graph
 * This helps us understand which modules depend on which
 */
export function buildDependencyGraph(
  server: ViteDevServer,
  registry: ModuleRegistry
): void {
  const moduleGraph = server.moduleGraph

  // Iterate through all tracked modules
  for (const metadata of registry.getAll().values()) {
    const viteModule = moduleGraph.getModuleById(metadata.filePath)

    if (viteModule) {
      // Get all imported modules
      const importedModules = viteModule.importedModules

      // Add them to our dependency set
      for (const imported of importedModules) {
        if (imported.file) {
          metadata.dependencies.add(imported.file)
        }
      }
    }
  }
}
