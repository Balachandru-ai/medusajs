import { MEDUSA_CLI_PATH, MedusaAppLoader } from "@medusajs/framework"
import { LinkLoader } from "@medusajs/framework/links"
import {
  ContainerRegistrationKeys,
  getResolvedPlugins,
  mergePluginModules,
} from "@medusajs/framework/utils"
import { Logger, MedusaContainer } from "@medusajs/types"
import { fork } from "child_process"
import path, { join } from "path"
import { initializeContainer } from "../../loaders"
import { ensureDbExists } from "../utils"
import { syncLinks } from "./sync-links"

const TERMINAL_SIZE = process.stdout.columns

const cliPath = path.resolve(MEDUSA_CLI_PATH, "..", "..", "cli.js")

/**
 * A low-level utility to migrate the database. This util should
 * never exit the process implicitly.
 */
export async function migrate({
  directory,
  skipLinks,
  skipScripts,
  executeAllLinks,
  executeSafeLinks,
  logger,
  container,
}: {
  directory: string
  skipLinks: boolean
  skipScripts: boolean
  executeAllLinks: boolean
  executeSafeLinks: boolean
  logger: Logger
  container: MedusaContainer
}): Promise<boolean> {
  /**
   * Setup
   */

  await ensureDbExists(container)

  const medusaAppLoader = new MedusaAppLoader()
  const configModule = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  )

  const plugins = await getResolvedPlugins(directory, configModule, true)
  mergePluginModules(configModule, plugins)

  const linksSourcePaths = plugins.map((plugin) =>
    join(plugin.resolve, "links")
  )
  await new LinkLoader(linksSourcePaths, logger).load()

  /**
   * Run migrations
   */
  logger.info("Running migrations...")
  await medusaAppLoader.runModulesMigrations({
    action: "run",
  })
  logger.log(new Array(TERMINAL_SIZE).join("-"))
  logger.info("Migrations completed")

  /**
   * Sync links
   */
  if (!skipLinks) {
    logger.log(new Array(TERMINAL_SIZE).join("-"))
    await syncLinks(medusaAppLoader, {
      executeAll: executeAllLinks,
      executeSafe: executeSafeLinks,
      directory,
      container,
    })
  }

  if (!skipScripts) {
    /**
     * Run migration scripts
     */
    logger.log(new Array(TERMINAL_SIZE).join("-"))
    const childProcess = fork(cliPath, ["db:migrate:scripts"], {
      cwd: directory,
      env: process.env,
    })

    await new Promise<void>((resolve, reject) => {
      childProcess.on("error", (error) => {
        reject(error)
      })
      childProcess.on("close", () => {
        resolve()
      })
    })
  }

  return true
}

const main = async function ({
  directory,
  skipLinks,
  skipScripts,
  executeAllLinks,
  executeSafeLinks,
}) {
  const container = await initializeContainer(directory)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const migrated = await migrate({
      directory,
      skipLinks,
      skipScripts,
      executeAllLinks,
      executeSafeLinks,
      logger,
      container,
    })
    process.exit(migrated ? 0 : 1)
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

export default main
