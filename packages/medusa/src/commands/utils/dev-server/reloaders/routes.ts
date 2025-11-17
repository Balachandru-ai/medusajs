import { ApiLoader } from "@medusajs/framework"
import { Logger } from "@medusajs/framework/types"
import { CONFIG, FileChangeAction } from "../types"
import { ModuleCacheManager } from "../module-cache-manager"
import { BaseReloader } from "./base"

/**
 * Handles hot reloading of API route files
 */
export class RouteReloader extends BaseReloader {
  #logSource: string
  #logger: Logger

  constructor(
    private apiLoader: ApiLoader | undefined,
    cacheManager: ModuleCacheManager,
    logSource: string,
    logger: Logger
  ) {
    super(cacheManager, logSource, logger)
    this.#logSource = logSource
    this.#logger = logger
  }

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
      this.#logger.error(
        `${this.#logSource} ApiLoader not available - cannot reload routes`
      )
      return
    }

    await this.apiLoader.unregisterExpressHandler(absoluteFilePath)

    if (action === "add" || action === "change") {
      this.clearModuleCache(absoluteFilePath)
      await this.apiLoader.reloadRoute(absoluteFilePath)
    }
  }
}
