import { logger as defaultLogger } from "@medusajs/framework/logger"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { initializeContainer } from "../../loaders"
import { dbCreate } from "./create"
import { migrate } from "./migrate"

const main = async function ({
  directory,
  interactive,
  db,
  skipLinks,
  skipScripts,
  executeAllLinks,
  executeSafeLinks,
}) {
  try {
    const container = await initializeContainer(directory)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    const created = await dbCreate({ directory, interactive, db, logger })
    if (!created) {
      process.exit(1)
    }

    const migrated = await migrate({
      directory,
      skipLinks,
      skipScripts,
      executeAllLinks,
      executeSafeLinks,
    })

    process.exit(migrated ? 0 : 1)
  } catch (error) {
    if (error.name === "ExitPromptError") {
      process.exit()
    }
    defaultLogger.error(error)
    process.exit(1)
  }
}

export default main
