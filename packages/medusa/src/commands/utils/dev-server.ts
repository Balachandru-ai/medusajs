import { ApiLoader } from "@medusajs/framework"
import { Logger } from "@medusajs/framework/types"
import {
  globalDevServerRegistry,
  inverseDevServerRegistry,
} from "@medusajs/framework/utils"
import path from "path"

/**
 * Track modules that failed to load due to missing dependencies
 * When a file is restored, these modules need to be cleared and reloaded
 */
const brokenModules = new Set<string>()

/**
 * Clear require cache for a file and all its parent/descendant modules
 */
async function clearModuleCache(
  filePath: string,
  logger?: any,
  onClear?: (modulePath: string) => Promise<void>,
  skipBrokenTracking: boolean = false
) {
  const absolutePath = path.resolve(filePath)
  const visitedModules = new Set<string>()

  async function clearDescendants(
    modulePath: string,
    visitedModules: Set<string>
  ) {
    if (modulePath.includes("node_modules")) {
      return
    }

    if (visitedModules.has(modulePath)) {
      return
    }
    visitedModules.add(modulePath)

    const moduleEntry = require.cache[modulePath]
    if (!moduleEntry) {
      return
    }

    if (moduleEntry.children) {
      for (const child of moduleEntry.children) {
        await clearDescendants(child.id, visitedModules)
      }
    }
    delete require.cache[modulePath]

    if (onClear) {
      await onClear(modulePath)
    }

    if (logger) {
      logger.debug(`Cleared cache: ${path.relative(process.cwd(), modulePath)}`)
    }
  }

  async function clearParents(targetPath: string, visitedModules: Set<string>) {
    const parentsToCheck = new Set<string>()

    for (const [modulePath, moduleEntry] of Object.entries(require.cache)) {
      if (modulePath.includes("node_modules")) {
        continue
      }
      if (moduleEntry && moduleEntry.children) {
        const hasChild = moduleEntry.children.some(
          (child) => child.id === targetPath
        )
        if (hasChild) {
          parentsToCheck.add(modulePath)
        }
      }
    }

    for (const modulePath of parentsToCheck) {
      if (visitedModules.has(modulePath)) {
        continue
      }

      visitedModules.add(modulePath)
      await clearParents(modulePath, visitedModules)

      // Mark as potentially broken before deletion
      // Only track broken modules when not in a recovery attempt
      if (!skipBrokenTracking) {
        brokenModules.add(modulePath)
      }

      delete require.cache[modulePath]

      if (onClear) {
        await onClear(modulePath)
      }
      if (logger) {
        logger.debug(
          `Cleared parent cache: ${path.relative(process.cwd(), modulePath)}`
        )
      }
    }
  }

  await clearParents(absolutePath, visitedModules)

  await clearDescendants(absolutePath, visitedModules)

  if (logger) {
    logger.info(
      `Cleared ${visitedModules.size} module(s) from cache for ${path.relative(
        process.cwd(),
        filePath
      )}`
    )
  }

  return visitedModules.size
}

export async function reloadRouteIfNecessary({
  action,
  absoluteFilePath,
  logger,
}: {
  action: "add" | "change" | "unlink"
  absoluteFilePath: string
  keepCache?: boolean
  logger: Logger
}) {
  const isRoute = absoluteFilePath.includes("api/")
  if (!isRoute) {
    return
  }
  const apiLoader = (global as any).__MEDUSA_HMR_API_LOADER__ as ApiLoader
  if (!apiLoader) {
    logger.error("ApiLoader not available - cannot reload routes")
    return
  }

  await apiLoader.unregisterExpressHandler(absoluteFilePath)

  if (action === "add" || action === "change") {
    if (require.cache[require.resolve(absoluteFilePath)]) {
      delete require.cache[require.resolve(absoluteFilePath)]
    }
    await apiLoader.reloadRoute(absoluteFilePath)
  }
}

export async function reloadWorkflowIfNecessary({
  action,
  absoluteFilePath,
  keepCache,
  skipRecovery,
  logger,
}: {
  action: "add" | "change" | "unlink"
  absoluteFilePath: string
  keepCache?: boolean
  skipRecovery?: boolean
  logger: Logger
}) {
  const isWorkflow = absoluteFilePath.includes("workflows/")
  if (!isWorkflow) {
    return
  }
  const workflowManager = global.WorkflowManager
  if (!workflowManager) {
    logger.error("WorkflowManager not available - cannot reload workflows")
    return
  }

  const requirableWorkflowPaths: Set<string> = new Set()
  const reloaders: (() => Promise<void>)[] = []

  const resources = globalDevServerRegistry.get(absoluteFilePath)

  if (resources) {
    for (const [type, resourceResources] of resources.entries()) {
      for (const resource of resourceResources) {
        if (type === "workflow") {
          workflowManager.unregister(resource.id)
          continue
        }

        if (type === "step") {
          const workflowSourcePaths = inverseDevServerRegistry.get(
            `step:${resource.id}`
          )
          if (workflowSourcePaths) {
            for (const workflowSourcePath_ of workflowSourcePaths) {
              const workflowResource =
                globalDevServerRegistry.get(workflowSourcePath_)
              if (workflowResource) {
                for (const [
                  workflowResourceType,
                  workflowResourceResources,
                ] of workflowResource.entries()) {
                  // eslint-disable-next-line max-len
                  for (const workflowResourceResource of workflowResourceResources) {
                    if (workflowResourceType === "workflow") {
                      workflowManager.unregister(workflowResourceResource.id)
                      requirableWorkflowPaths.add(workflowSourcePath_)
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  if (!keepCache) {
    await clearModuleCache(
      absoluteFilePath,
      logger,
      async (modulePath) => {
        reloaders.push(async () =>
          reloadResources({
            action: "change" as const,
            absoluteFilePath: modulePath,
            keepCache: true,
            skipRecovery: skipRecovery,
            logger,
          })
        )
      },
      skipRecovery // Don't track broken modules during recovery
    )
  }

  if (action !== "unlink") {
    for (const requirableWorkflowPath of Array.from(requirableWorkflowPaths)) {
      require(requirableWorkflowPath)
    }
    require(absoluteFilePath)
  }

  if (reloaders.length) {
    await Promise.all(reloaders.map(async (reloader) => reloader()))
  }
}

export async function reloadResources({
  action,
  absoluteFilePath,
  keepCache,
  logger,
  skipRecovery = false,
}: {
  action: "add" | "change" | "unlink"
  absoluteFilePath: string
  keepCache?: boolean
  logger: Logger
  skipRecovery?: boolean
}) {
  await reloadRouteIfNecessary({
    action,
    absoluteFilePath,
    keepCache,
    logger,
  })
  await reloadWorkflowIfNecessary({
    action,
    absoluteFilePath,
    keepCache,
    skipRecovery,
    logger,
  })

  // Attempt to recover broken modules after any file change
  // Skip if this is a recursive recovery attempt to prevent infinite loops
  if (brokenModules.size > 0 && !skipRecovery) {
    logger.info(`Attempting to recover ${brokenModules.size} broken module(s)`)

    const brokenModulesList = Array.from(brokenModules)

    for (const modulePath of brokenModulesList) {
      delete require.cache[modulePath]
      logger.info(
        `Attempting to reload: ${path.relative(process.cwd(), modulePath)}`
      )

      try {
        await reloadResources({
          action: "change",
          absoluteFilePath: modulePath,
          keepCache: false,
          logger,
          skipRecovery: true,
        })

        brokenModules.delete(modulePath)
        logger.info(
          `Successfully recovered: ${path.relative(process.cwd(), modulePath)}`
        )
      } catch (error) {
        logger.debug(
          `Could not recover ${path.relative(
            process.cwd(),
            modulePath
          )}: ${error}`
        )
      }
    }

    if (brokenModules.size > 0) {
      logger.debug(
        `${brokenModules.size} module(s) remain broken. They may recover when additional dependencies are restored.`
      )
    } else {
      logger.info("All broken modules successfully recovered")
    }
  }
}
