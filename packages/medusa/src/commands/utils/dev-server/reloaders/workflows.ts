import { Logger } from "@medusajs/framework/types"
import { ModuleCacheManager } from "../module-cache-manager"
import { ResourceRegistry } from "../resource-registry"
import {
  CONFIG,
  DevServerGlobals,
  ReloadParams,
  FileChangeAction,
} from "../types"
import { ResourceEntry, ResourceMap } from "@medusajs/framework/utils"

/**
 * Handles hot reloading of workflow and step files
 */
export class WorkflowReloader {
  constructor(
    private workflowManager: DevServerGlobals["WorkflowManager"],
    private registry: ResourceRegistry,
    private cacheManager: ModuleCacheManager,
    private reloadResources: (params: ReloadParams) => Promise<void>,
    private logSource: string,
    private logger: Logger
  ) {}

  /**
   * Check if a file path represents a workflow
   */
  private isWorkflowPath(filePath: string): boolean {
    return filePath.includes(CONFIG.RESOURCE_PATH_PATTERNS.workflow)
  }

  /**
   * Reload a workflow file if necessary
   */
  async reload(
    action: FileChangeAction,
    absoluteFilePath: string,
    keepCache: boolean = false,
    skipRecovery: boolean = false
  ): Promise<void> {
    if (!this.isWorkflowPath(absoluteFilePath)) {
      return
    }

    if (!this.workflowManager) {
      this.logger.error(
        `${this.logSource} WorkflowManager not available - cannot reload workflows`
      )
      return
    }

    const requirableWorkflowPaths = new Set<string>()
    const reloaders: Array<() => Promise<void>> = []

    // Unregister resources and collect affected workflows
    this.unregisterResources(absoluteFilePath, requirableWorkflowPaths)

    if (!keepCache) {
      await this.clearWorkflowCache(absoluteFilePath, reloaders, skipRecovery)
    }

    this.clearWorkflowFileCache(absoluteFilePath)

    // Reload workflows that were affected
    if (action !== "unlink") {
      this.reloadWorkflowModules(requirableWorkflowPaths, absoluteFilePath)
    }

    // Execute deferred reloaders
    if (reloaders.length) {
      await Promise.all(reloaders.map(async (reloader) => reloader()))
    }
  }

  /**
   * Unregister workflow and step resources
   */
  private unregisterResources(
    absoluteFilePath: string,
    affectedWorkflows: Set<string>
  ): void {
    const resources = this.registry.getResources(absoluteFilePath)
    if (!resources) {
      return
    }

    for (const [type, resourceList] of resources.entries()) {
      for (const resource of resourceList) {
        if (type === "workflow") {
          this.workflowManager!.unregister(resource.id)
        } else if (type === "step") {
          this.handleStepUnregister(resource, affectedWorkflows)
        }
      }
    }
  }

  /**
   * Handle unregistering a step and find affected workflows
   */
  private handleStepUnregister(
    stepResource: ResourceEntry,
    affectedWorkflows: Set<string>
  ): void {
    const workflowSourcePaths = this.registry.getWorkflowSourcePaths(
      stepResource.id
    )

    if (!workflowSourcePaths) {
      return
    }

    for (const sourcePath of workflowSourcePaths) {
      const workflowResources = this.registry.getResources(sourcePath)
      if (!workflowResources) {
        continue
      }

      this.unregisterWorkflowsInResource(
        workflowResources,
        affectedWorkflows,
        sourcePath
      )
    }
  }

  /**
   * Unregister workflows found in a resource and track their paths
   */
  private unregisterWorkflowsInResource(
    workflowResources: ResourceMap,
    affectedWorkflows: Set<string>,
    sourcePath: string
  ): void {
    for (const [type, resourceList] of workflowResources.entries()) {
      if (type !== "workflow") {
        continue
      }

      for (const workflow of resourceList) {
        this.workflowManager!.unregister(workflow.id)
        affectedWorkflows.add(sourcePath)
      }
    }
  }

  /**
   * Clear only the specific workflow file from cache
   */
  private clearWorkflowFileCache(absoluteFilePath: string): void {
    const resolved = require.resolve(absoluteFilePath)
    if (require.cache[resolved]) {
      delete require.cache[resolved]
    }
  }

  /**
   * Clear workflow cache and collect deferred reloaders
   */
  private async clearWorkflowCache(
    absoluteFilePath: string,
    reloaders: Array<() => Promise<void>>,
    skipRecovery: boolean
  ): Promise<void> {
    await this.cacheManager.clear(
      absoluteFilePath,
      this.logger,
      async (modulePath) => {
        // Create deferred reloader for each cleared module
        reloaders.push(async () =>
          this.reloadResources({
            logSource: this.logSource,
            action: "change",
            absoluteFilePath: modulePath,
            keepCache: true,
            skipRecovery: true, // handled by the main caller
            logger: this.logger,
          })
        )
      },
      !skipRecovery // Track broken modules unless we're in recovery mode
    )
  }

  /**
   * Reload workflow modules using require
   */
  private reloadWorkflowModules(
    workflowPaths: Set<string>,
    mainFilePath: string
  ): void {
    for (const workflowPath of workflowPaths) {
      require(workflowPath)
    }
    require(mainFilePath)
  }
}
