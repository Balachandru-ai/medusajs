import { Logger } from "@medusajs/framework/types"
import { ModuleCacheManager } from "./module-cache-manager"
import path from "path"
import { ReloadParams } from "./types"

/**
 * Handles recovery of broken modules after dependencies are restored
 */
export class RecoveryService {
  constructor(
    private cacheManager: ModuleCacheManager,
    private reloadResources: (params: ReloadParams) => Promise<void>,
    private logger: Logger
  ) {}

  /**
   * Attempt to recover all broken modules
   */
  async recoverBrokenModules(): Promise<void> {
    const brokenCount = this.cacheManager.getBrokenModuleCount()
    if (!brokenCount) {
      return
    }

    this.logger.info(`Attempting to recover ${brokenCount} broken module(s)`)

    const brokenModules = this.cacheManager.getBrokenModules()

    for (const modulePath of brokenModules) {
      await this.attemptModuleRecovery(modulePath)
    }

    this.logRecoveryResults()
  }

  /**
   * Attempt to recover a single broken module
   */
  private async attemptModuleRecovery(modulePath: string): Promise<void> {
    this.cacheManager.clearSingleModule(modulePath)

    const relativePath = path.relative(process.cwd(), modulePath)
    this.logger.info(`Attempting to reload: ${relativePath}`)

    try {
      // Attempt reload with skipRecovery=true to prevent infinite recursion
      await this.reloadResources({
        action: "change",
        absoluteFilePath: modulePath,
        keepCache: false,
        logger: this.logger,
        skipRecovery: true,
      })

      this.cacheManager.removeBrokenModule(modulePath)
      this.logger.info(`Successfully recovered: ${relativePath}`)
    } catch (error) {
      this.logger.debug(`Could not recover ${relativePath}: ${error}`)
    }
  }

  /**
   * Log final recovery results
   */
  private logRecoveryResults(): void {
    const remainingBroken = this.cacheManager.getBrokenModuleCount()

    if (remainingBroken) {
      this.logger.debug(
        `${remainingBroken} module(s) remain broken. They may recover when additional dependencies are restored.`
      )
    } else {
      this.logger.info("All broken modules successfully recovered")
    }
  }
}
