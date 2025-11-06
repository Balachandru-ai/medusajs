import { writeFileSync } from "fs"
import { relative } from "path"
import type { Logger } from "@medusajs/types"

type TracedModule = {
  id: string
  resolved: string
  parent: string | null
  isNodeModule: boolean
  isDynamic: boolean
  timestamp: number
}

/**
 * Module tracer that intercepts all require() and import() calls
 * to build a manifest of runtime dependencies
 */
export class ModuleTracer {
  #tracedModules: Map<string, TracedModule> = new Map()
  #projectRoot: string
  #logger: Logger
  #originalRequire: any
  #isTracing: boolean = false

  constructor(projectRoot: string, logger: Logger) {
    this.#projectRoot = projectRoot
    this.#logger = logger
  }

  /**
   * Start tracing all module loads
   */
  start() {
    if (this.#isTracing) {
      return
    }

    this.#isTracing = true
    this.#logger.info("Starting module tracer...")

    // Hook into Node's module system
    const Module = require("module")
    this.#originalRequire = Module.prototype.require

    const self = this
    Module.prototype.require = function (id: string) {
      try {
        // Resolve the module path
        const resolved = Module._resolveFilename(id, this)
        const parent = this.filename || null

        // Track this module
        self.#trackModule({
          id,
          resolved,
          parent,
          isNodeModule: resolved.includes("node_modules"),
          isDynamic: false,
          timestamp: Date.now(),
        })
      } catch (error) {
        // Module resolution failed, skip tracking
      }

      // Call original require
      return self.#originalRequire.apply(this, arguments)
    }

    this.#logger.info("Module tracer activated")
  }

  /**
   * Stop tracing and save manifest
   */
  stop(outputPath: string): number {
    if (!this.#isTracing) {
      return 0
    }

    this.#isTracing = false
    this.#logger.info("Stopping module tracer...")

    // Restore original require
    const Module = require("module")
    Module.prototype.require = this.#originalRequire

    // Generate manifest
    const manifest = this.#generateManifest()

    // Save to file
    writeFileSync(outputPath, JSON.stringify(manifest, null, 2))

    this.#logger.info(
      `Module manifest saved to ${relative(this.#projectRoot, outputPath)}`
    )
    this.#logger.info(`Traced ${this.#tracedModules.size} unique modules`)

    // Log manifest stats
    this.#logger.info("Manifest stats:")
    this.#logger.info(`  - Total: ${manifest.stats.total}`)
    this.#logger.info(`  - User modules: ${manifest.stats.userModules}`)
    this.#logger.info(`  - Node modules: ${manifest.stats.nodeModules}`)
    this.#logger.info(`  - Dependencies: ${manifest.stats.uniqueDependencies}`)

    return this.#tracedModules.size
  }

  /**
   * Track a loaded module
   */
  #trackModule(module: TracedModule) {
    // Use resolved path as key to avoid duplicates
    if (!this.#tracedModules.has(module.resolved)) {
      this.#tracedModules.set(module.resolved, module)
    }
  }

  /**
   * Generate manifest from traced modules
   */
  #generateManifest() {
    const modules = Array.from(this.#tracedModules.values())

    // Categorize modules
    const configFiles = ["medusa-config", "instrumentation"]

    // Include both user modules AND Medusa's built-in modules (api/subscribers/jobs/workflows)
    // that should be bundled
    const userModules = modules.filter((m) => {
      // User's own modules from src/
      if (!m.isNodeModule && !m.isDynamic && m.resolved.startsWith(this.#projectRoot)) {
        return !configFiles.some((cfg) => m.resolved.includes(`${cfg}.`))
      }

      // Medusa's built-in modules from @medusajs/medusa package
      // Include api routes, subscribers, jobs, workflows
      if (m.isNodeModule && m.resolved.includes("@medusajs/medusa/")) {
        return (
          m.resolved.includes("/api/") ||
          m.resolved.includes("/subscribers/") ||
          m.resolved.includes("/jobs/") ||
          m.resolved.includes("/workflows/")
        )
      }

      return false
    })

    const nodeModules = modules.filter((m) => m.isNodeModule)
    const dynamicImports = modules.filter((m) => m.isDynamic)

    // Extract unique package names from node_modules
    const dependencies = new Set<string>()
    nodeModules.forEach((m) => {
      const packageName = this.#extractPackageName(m.resolved)
      if (packageName) {
        dependencies.add(packageName)
      }
    })

    return {
      timestamp: Date.now(),
      projectRoot: this.#projectRoot,
      stats: {
        total: modules.length,
        userModules: userModules.length,
        nodeModules: nodeModules.length,
        dynamicImports: dynamicImports.length,
        uniqueDependencies: dependencies.size,
      },
      userModules: userModules.map((m) => ({
        path: relative(this.#projectRoot, m.resolved),
        absolutePath: m.resolved,
        parent: m.parent ? relative(this.#projectRoot, m.parent) : null,
      })),
      dependencies: Array.from(dependencies).sort(),
      dynamicImports: dynamicImports.map((m) => m.id),
    }
  }

  /**
   * Extract package name from node_modules path
   */
  #extractPackageName(modulePath: string): string | null {
    const match = modulePath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/)
    return match ? match[1] : null
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      totalModules: this.#tracedModules.size,
      isTracing: this.#isTracing,
    }
  }
}
