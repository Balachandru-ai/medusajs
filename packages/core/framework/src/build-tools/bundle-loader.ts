import { readFileSync, existsSync } from "fs"
import path from "path"

type RouteManifest = Record<
  string,
  {
    bundle: string
    export: string
  }
>

/**
 * BundleLoader provides a virtual file system interface
 * for loading modules from optimized bundles instead of individual files.
 * This enables full tree shaking while maintaining Medusa's file-based routing.
 */
export class BundleLoader {
  #rootDir: string
  #manifest: RouteManifest | null = null
  #bundles: Map<string, any> = new Map()
  #enabled: boolean = false

  constructor(rootDir: string) {
    this.#rootDir = rootDir
    this.#loadManifest()
  }

  /**
   * Load the route manifest if it exists
   */
  #loadManifest() {
    const manifestPath = path.join(this.#rootDir, "route-manifest.json")

    if (existsSync(manifestPath)) {
      try {
        const content = readFileSync(manifestPath, "utf-8")
        this.#manifest = JSON.parse(content)
        this.#enabled = true
      } catch (error) {
        console.warn("Failed to load route manifest:", error)
        this.#enabled = false
      }
    }
  }

  /**
   * Check if bundle loader is enabled
   */
  isEnabled(): boolean {
    return this.#enabled && this.#manifest !== null
  }

  /**
   * Load a bundle file and cache it
   */
  #loadBundle(bundleName: string): any {
    if (this.#bundles.has(bundleName)) {
      return this.#bundles.get(bundleName)
    }

    const bundlePath = path.join(this.#rootDir, bundleName)
    if (!existsSync(bundlePath)) {
      throw new Error(`Bundle not found: ${bundlePath}`)
    }

    // Load the bundle (CommonJS require)
    const bundle = require(bundlePath)
    this.#bundles.set(bundleName, bundle)
    return bundle
  }

  /**
   * Load a module from bundles by its original path
   * @param originalPath - Original source path (e.g., "src/api/admin/route.ts")
   * @returns The module exports
   */
  loadModule(originalPath: string): any {
    if (!this.isEnabled() || !this.#manifest) {
      throw new Error("Bundle loader not enabled")
    }

    const entry = this.#manifest[originalPath]
    if (!entry) {
      throw new Error(
        `Module not found in manifest: ${originalPath}\nAvailable: ${Object.keys(
          this.#manifest
        )
          .slice(0, 5)
          .join(", ")}...`
      )
    }

    // Load the bundle
    const bundle = this.#loadBundle(entry.bundle)

    // Get the specific export
    const moduleExports = bundle[entry.export]
    if (!moduleExports) {
      throw new Error(
        `Export ${entry.export} not found in bundle ${entry.bundle}`
      )
    }

    return moduleExports
  }

  /**
   * Get all available module paths
   */
  getAvailableModules(): string[] {
    if (!this.#manifest) {
      return []
    }
    return Object.keys(this.#manifest)
  }

  /**
   * Check if a module exists in the manifest
   */
  hasModule(originalPath: string): boolean {
    return this.#manifest !== null && originalPath in this.#manifest
  }

  /**
   * Get statistics about loaded bundles
   */
  getStats() {
    return {
      enabled: this.#enabled,
      manifestEntries: this.#manifest ? Object.keys(this.#manifest).length : 0,
      loadedBundles: this.#bundles.size,
      availableBundles: this.#manifest
        ? new Set(Object.values(this.#manifest).map((e) => e.bundle)).size
        : 0,
    }
  }
}

/**
 * Global bundle loader instance
 */
let globalBundleLoader: BundleLoader | null = null

/**
 * Initialize the global bundle loader
 */
export function initializeBundleLoader(rootDir: string): BundleLoader {
  if (!globalBundleLoader) {
    globalBundleLoader = new BundleLoader(rootDir)
  }
  return globalBundleLoader
}

/**
 * Get the global bundle loader instance
 */
export function getBundleLoader(): BundleLoader | null {
  return globalBundleLoader
}
