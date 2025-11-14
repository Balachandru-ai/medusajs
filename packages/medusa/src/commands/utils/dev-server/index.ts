import { container } from "@medusajs/framework"
import { logger } from "@medusajs/framework/logger"
import { ModuleCacheManager } from "./module-cache-manager"
import { RecoveryService } from "./recovery-service"
import { RouteReloader } from "./reloaders/routes"
import { SubscriberReloader } from "./reloaders/subscribers"
import { WorkflowReloader } from "./reloaders/workflows"
import { ResourceRegistry } from "./resource-registry"
import { DevServerGlobals, ReloadParams } from "./types"

const sharedCacheManager = new ModuleCacheManager()
const sharedRegistry = new ResourceRegistry()

const reloaders = {} as {
  routesReloader: RouteReloader
  subscribersReloader?: SubscriberReloader
  workflowsReloader: WorkflowReloader
}

function initializeReloaders() {
  const globals = global as unknown as DevServerGlobals

  if (!reloaders.routesReloader) {
    const routeReloader = new RouteReloader(
      globals.__MEDUSA_HMR_API_LOADER__,
      logger
    )
    reloaders.routesReloader = routeReloader
  }

  if (!reloaders.subscribersReloader) {
    const subscriberReloader = new SubscriberReloader(
      container,
      sharedRegistry,
      logger
    )
    reloaders.subscribersReloader = subscriberReloader
  }

  if (!reloaders.workflowsReloader) {
    const workflowReloader = new WorkflowReloader(
      globals.WorkflowManager,
      sharedRegistry,
      sharedCacheManager,
      reloadResources,
      logger
    )
    reloaders.workflowsReloader = workflowReloader
  }
}

/**
 * Main entry point for reloading resources (routes, subscribers, and workflows)
 * Orchestrates the reload process and handles recovery of broken modules
 */
export async function reloadResources({
  action,
  absoluteFilePath,
  keepCache,
  logger,
  skipRecovery = false,
}: ReloadParams): Promise<void> {
  initializeReloaders()

  await reloaders.routesReloader.reload(action, absoluteFilePath)
  await reloaders.subscribersReloader?.reload?.(action, absoluteFilePath)
  await reloaders.workflowsReloader.reload(
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
