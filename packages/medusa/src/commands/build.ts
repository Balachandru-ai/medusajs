import { Compiler } from "@medusajs/framework/build-tools"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { initializeContainer } from "../loaders"

export default async function build({
  directory,
  adminOnly,
  production,
}: {
  directory: string
  adminOnly: boolean
  production?: boolean
}) {
  const container = await initializeContainer(directory, {
    skipDbConnection: true,
  })
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Starting build...")
  const compiler = new Compiler(directory, logger)

  const tsConfig = await compiler.loadTSConfigFile()
  if (!tsConfig) {
    logger.error("Unable to compile application")
    process.exit(1)
  }

  /**
   * Production bundle mode: Create optimized, self-contained bundle
   */
  if (production) {
    const success = await compiler.buildProductionBundle(tsConfig)
    process.exit(success ? 0 : 1)
  }

  /**
   * Standard build mode: Compile backend and frontend separately
   */
  const promises: Promise<boolean>[] = []
  if (!adminOnly) {
    promises.push(compiler.buildAppBackend(tsConfig))
  }

  const bundler = await import("@medusajs/admin-bundler")
  promises.push(compiler.buildAppFrontend(adminOnly, tsConfig, bundler))
  const responses = await Promise.all(promises)

  if (responses.every((response) => response === true)) {
    process.exit(0)
  } else {
    process.exit(1)
  }
}
