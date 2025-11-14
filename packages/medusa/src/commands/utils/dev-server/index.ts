import { ModuleCacheManager } from "./module-cache-manager"
import { RecoveryService } from "./recovery-service"
import { RouteReloader } from "./reloaders/routes"
import { WorkflowReloader } from "./reloaders/workflows"
import { ResourceRegistry } from "./resource-registry"
import { DevServerGlobals, ReloadParams } from "./types"

const sharedCacheManager = new ModuleCacheManager()
const sharedRegistry = new ResourceRegistry()

/**
 * Main entry point for reloading resources (routes and workflows)
 * Orchestrates the reload process and handles recovery of broken modules
 */
export async function reloadResources({
  action,
  absoluteFilePath,
  keepCache,
  logger,
  skipRecovery = false,
}: ReloadParams): Promise<void> {
  const globals = global as unknown as DevServerGlobals

  const routeReloader = new RouteReloader(
    globals.__MEDUSA_HMR_API_LOADER__,
    logger
  )

  const workflowReloader = new WorkflowReloader(
    globals.WorkflowManager,
    sharedRegistry,
    sharedCacheManager,
    reloadResources,
    logger
  )

  // Reload routes and workflows
  await routeReloader.reload(action, absoluteFilePath)
  await workflowReloader.reload(
    action,
    absoluteFilePath,
    keepCache,
    skipRecovery
  )

  // Attempt recovery of broken modules (unless we're already in recovery mode)
  if (!skipRecovery) {
    const recoveryService = new RecoveryService(
      sharedCacheManager,
      reloadResources,
      logger
    )

    await recoveryService.recoverBrokenModules()
  }
}
