import type { Express, IRouter } from "express"
import type { RouteMetadata } from "./types"

/**
 * Registry for tracking loaded routes with Express-specific metadata
 * This allows us to unregister and re-register routes for hot reload
 */
export class RouteRegistry {
  /**
   * Map of file paths to route metadata
   * Key: absolute file path
   * Value: array of route metadata (one file can export multiple routes)
   */
  private routes: Map<string, RouteMetadata[]> = new Map()

  /**
   * Register a route with its metadata
   */
  register(metadata: RouteMetadata): void {
    const existing = this.routes.get(metadata.filePath) || []
    existing.push(metadata)
    this.routes.set(metadata.filePath, existing)
  }

  /**
   * Register multiple routes from the same file
   */
  registerMany(filePath: string, routes: RouteMetadata[]): void {
    this.routes.set(filePath, routes)
  }

  /**
   * Get all routes for a specific file
   */
  getByFile(filePath: string): RouteMetadata[] | undefined {
    return this.routes.get(filePath)
  }

  /**
   * Get all tracked routes
   */
  getAll(): Map<string, RouteMetadata[]> {
    return new Map(this.routes)
  }

  /**
   * Unregister routes for a specific file
   * This removes them from Express and our registry
   */
  async unregister(filePath: string, app: Express): Promise<boolean> {
    const routes = this.routes.get(filePath)
    if (!routes) {
      return false
    }

    // Remove each route from Express
    for (const route of routes) {
      const success = this.removeRouteFromExpress(app, route)
      if (!success) {
        console.warn(
          `[HMR] Failed to remove route ${route.meta.method} ${route.meta.path}`
        )
      }

      // Run cleanup if provided
      if (route.cleanup) {
        await route.cleanup()
      }
    }

    // Remove from our registry
    this.routes.delete(filePath)
    return true
  }

  /**
   * Remove a route from Express by manipulating the router stack
   * This is the tricky part - Express doesn't have a built-in way to remove routes
   */
  private removeRouteFromExpress(app: Express, route: RouteMetadata): boolean {
    try {
      const router = app._router as IRouter

      if (!router || !router.stack) {
        return false
      }

      // Find the layer in the router stack
      const layerIndex = router.stack.findIndex((layer: any) => {
        // Match by route path and method
        if (layer.route) {
          const routePath = layer.route.path
          const routeMethods = layer.route.methods

          return (
            routePath === route.meta.path &&
            routeMethods[route.meta.method.toLowerCase()]
          )
        }
        return false
      })

      if (layerIndex !== -1) {
        // Remove the layer from the stack
        router.stack.splice(layerIndex, 1)
        return true
      }

      return false
    } catch (error) {
      console.error(
        `[HMR] Error removing route ${route.meta.method} ${route.meta.path}:`,
        error
      )
      return false
    }
  }

  /**
   * Clear all routes
   */
  clear(): void {
    this.routes.clear()
  }

  /**
   * Get statistics about tracked routes
   */
  getStats(): {
    totalFiles: number
    totalRoutes: number
    byMethod: Record<string, number>
  } {
    let totalRoutes = 0
    const byMethod: Record<string, number> = {}

    for (const routes of this.routes.values()) {
      totalRoutes += routes.length
      for (const route of routes) {
        const method = route.meta.method
        byMethod[method] = (byMethod[method] || 0) + 1
      }
    }

    return {
      totalFiles: this.routes.size,
      totalRoutes,
      byMethod,
    }
  }
}

/**
 * Create a new route registry instance
 */
export function createRouteRegistry(): RouteRegistry {
  return new RouteRegistry()
}
