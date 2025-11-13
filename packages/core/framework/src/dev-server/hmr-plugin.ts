import path from "path"
import type { HmrUpdate } from "./types"

// Use any types for Vite to avoid build-time dependency
type Plugin = any
type ViteDevServer = any
type ModuleNode = any
type ModuleGraph = any

/**
 * Vite plugin for backend HMR
 * Tracks module changes and dependencies, and triggers selective reloads
 */
export function createHmrPlugin(
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

        // This implements the dependency tree: finds all files that use the changed file (upstream dependents)
        let affectedPaths: string[] = [normalizedPath] // At minimum, the changed file itself
        if (module) {
          const affectedSet = new Set<string>()
          collectAffectedPaths(module, server.moduleGraph, affectedSet)
          affectedPaths = Array.from(affectedSet)
        }

        // Invalidate modules in Vite's module graph (already recurses on importers/dependents)
        if (module) {
          await invalidateModule(module, server)
        }

        // Trigger the update callback
        const update: HmrUpdate = {
          type: event as "add" | "change" | "unlink",
          path: normalizedPath,
          affectedPaths,
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
 * MODIFIED: Renamed and simplified to collect affected paths using Vite's ModuleGraph
 * Recursively traverses importers (dependents) to find all files that use the changed module
 */
function collectAffectedPaths(
  module: ModuleNode,
  graph: ModuleGraph,
  set: Set<string>
): void {
  for (const importer of module.importers) {
    if (importer.file && !set.has(importer.file)) {
      set.add(importer.file)
      collectAffectedPaths(importer, graph, set)
    }
  }
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
 * MODIFIED: Left as-is, but commented out in index.ts since HMR now uses direct ModuleGraph traversal.
 * If needed for other purposes (e.g., initial stats), uncomment the call in index.ts.
 */
export function buildDependencyGraph(
  server: ViteDevServer,
  registry: any // MODIFIED: Added type for registry if used
): void {
  const moduleGraph = server.moduleGraph

  // Iterate through all tracked modules
  // Note: Assumes registry has getAll() returning Map<string, {dependencies: Set<string>}>
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
