import { container } from "@medusajs/framework"
import { logger } from "@medusajs/framework/logger"
import { ModuleCacheManager } from "./module-cache-manager"
import { RecoveryService } from "./recovery-service"
import { RouteReloader } from "./reloaders/routes"
import { SubscriberReloader } from "./reloaders/subscribers"
import { WorkflowReloader } from "./reloaders/workflows"
import { ResourceRegistry } from "./resource-registry"
import { DevServerGlobals, ReloadParams } from "./types"
import { JobReloader } from "./reloaders/jobs"

let sharedCacheManager!: ModuleCacheManager
const sharedRegistry = new ResourceRegistry()

const reloaders = {} as {
  routesReloader: RouteReloader
  subscribersReloader?: SubscriberReloader
  workflowsReloader: WorkflowReloader
  jobsReloader?: JobReloader
}

function initializeReloaders(logSource: string) {
  sharedCacheManager ??= new ModuleCacheManager(logSource)

  const globals = global as unknown as DevServerGlobals

  if (!reloaders.routesReloader) {
    const routeReloader = new RouteReloader(
      globals.__MEDUSA_HMR_API_LOADER__,
      sharedCacheManager,
      logSource,
      logger
    )
    reloaders.routesReloader = routeReloader
  }

  if (!reloaders.subscribersReloader) {
    const subscriberReloader = new SubscriberReloader(
      container,
      sharedCacheManager,
      sharedRegistry,
      logSource,
      logger
    )
    reloaders.subscribersReloader = subscriberReloader
  }

  if (!reloaders.workflowsReloader) {
    const workflowReloader = new WorkflowReloader(
      globals.WorkflowManager,
      sharedCacheManager,
      sharedRegistry,
      reloadResources,
      logSource,
      logger
    )
    reloaders.workflowsReloader = workflowReloader
  }

  if (!reloaders.jobsReloader) {
    const jobReloader = new JobReloader(
      globals.WorkflowManager,
      sharedCacheManager,
      container,
      sharedRegistry,
      logSource,
      logger
    )
    reloaders.jobsReloader = jobReloader
  }
}

/**
 * Main entry point for reloading resources (routes, subscribers, and workflows)
 * Orchestrates the reload process and handles recovery of broken modules
 */
export async function reloadResources({
  logSource,
  action,
  absoluteFilePath,
  keepCache,
  logger,
  skipRecovery = false,
}: ReloadParams): Promise<void> {
  initializeReloaders(logSource)

  // Reload in dependency order: workflows → routes → subscribers → jobs
  // Jobs depend on workflows, so workflows must be reloaded first
  await reloaders.workflowsReloader.reload(
    action,
    absoluteFilePath,
    keepCache,
    skipRecovery
  )
  await reloaders.routesReloader.reload(action, absoluteFilePath)
  await reloaders.subscribersReloader?.reload?.(action, absoluteFilePath)
  await reloaders.jobsReloader?.reload?.(action, absoluteFilePath)

  // Attempt recovery of broken modules (unless we're already in recovery mode)
  if (!skipRecovery) {
    const recoveryService = new RecoveryService(
      sharedCacheManager,
      reloadResources,
      logSource,
      logger
    )

    await recoveryService.recoverBrokenModules()
  }
}
