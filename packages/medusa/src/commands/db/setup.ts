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
  const container = await initializeContainer(directory)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
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
      logger,
      container,
    })

    process.exit(migrated ? 0 : 1)
  } catch (error) {
    if (error.name === "ExitPromptError") {
      process.exit()
    }
    logger.error(error)
    process.exit(1)
  }
}

export default main
