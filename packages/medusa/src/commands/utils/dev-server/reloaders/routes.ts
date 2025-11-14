import { ApiLoader } from "@medusajs/framework"
import { Logger } from "@medusajs/framework/types"
import { CONFIG, FileChangeAction } from "../types"

/**
 * Handles hot reloading of API route files
 */
export class RouteReloader {
  constructor(
    private apiLoader: ApiLoader | undefined,
    private logger: Logger
  ) {}

  /**
   * Check if a file path represents a route
   */
  private isRoutePath(filePath: string): boolean {
    return filePath.includes(CONFIG.RESOURCE_PATH_PATTERNS.route)
  }

  /**
   * Reload a route file if necessary
   */
  async reload(
    action: FileChangeAction,
    absoluteFilePath: string
  ): Promise<void> {
    if (!this.isRoutePath(absoluteFilePath)) {
      return
    }

    if (!this.apiLoader) {
      this.logger.error("ApiLoader not available - cannot reload routes")
      return
    }

    await this.apiLoader.unregisterExpressHandler(absoluteFilePath)

    if (action === "add" || action === "change") {
      this.clearRouteCache(absoluteFilePath)
      await this.apiLoader.reloadRoute(absoluteFilePath)
    }
  }

  /**
   * Clear require cache for a specific route
   */
  private clearRouteCache(absoluteFilePath: string): void {
    const resolved = require.resolve(absoluteFilePath)
    if (require.cache[resolved]) {
      delete require.cache[resolved]
    }
  }
}
