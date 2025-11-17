import { JobLoader } from "@medusajs/framework/jobs"
import { Logger, MedusaContainer } from "@medusajs/framework/types"
import { ResourceRegistry } from "../resource-registry"
import { CONFIG, DevServerGlobals, FileChangeAction } from "../types"

/**
 * Metadata for a registered subscriber
 */
interface JobMetadata {
  name: string
  [key: string]: any
}

export class JobReloader {
  constructor(
    private workflowManager: DevServerGlobals["WorkflowManager"],
    private container: MedusaContainer,
    private registry: ResourceRegistry,
    private logSource: string,
    private logger: Logger
  ) {}

  /**
   * Check if a file path represents a subscriber
   */
  private isJobPath(filePath: string): boolean {
    return filePath.includes(CONFIG.RESOURCE_PATH_PATTERNS.job)
  }

  /**
   * Unregister a subscriber from the event-bus
   */
  private unregisterJob(metadata: JobMetadata): void {
    this.workflowManager?.unregister(metadata.name)
    this.logger.debug(`${this.logSource} Unregistered job ${metadata.name}`)
  }

  /**
   * Register a subscriber by loading the file and extracting its metadata
   */
  private async registerJob(absoluteFilePath: string) {
    const jobLoader = new JobLoader([], this.container)
    await jobLoader.loadFile(absoluteFilePath)
    this.logger.debug(`${this.logSource} Registered job ${absoluteFilePath}`)
  }

  /**
   * Clear require cache for a job file
   */
  private clearJobCache(absoluteFilePath: string): void {
    const resolved = require.resolve(absoluteFilePath)
    if (require.cache[resolved]) {
      delete require.cache[resolved]
    }
  }

  /**
   * Reload a subscriber file if necessary
   */
  async reload(
    action: FileChangeAction,
    absoluteFilePath: string
  ): Promise<void> {
    if (!this.isJobPath(absoluteFilePath)) {
      return
    }

    const existingResources = this.registry.getResources(absoluteFilePath)
    if (existingResources) {
      for (const [_, resources] of existingResources) {
        for (const resource of resources) {
          this.unregisterJob({
            name: resource.id,
            config: resource.config,
          })
        }
      }
    }

    if (action === "add" || action === "change") {
      this.clearJobCache(absoluteFilePath)
      await this.registerJob(absoluteFilePath)
    }
  }
}
