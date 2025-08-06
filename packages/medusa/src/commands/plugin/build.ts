import { Compiler } from "@medusajs/framework/build-tools"
import { configLoader } from "@medusajs/framework/config"

export default async function build({ directory }: { directory: string }) {
  const config = await configLoader(directory, "medusa-config")
  const logger = config.logger!

  logger.info("Starting build...")
  const compiler = new Compiler(directory, logger)

  const tsConfig = await compiler.loadTSConfigFile()
  if (!tsConfig) {
    logger.error("Unable to compile plugin")
    process.exit(1)
  }

  const bundler = await import("@medusajs/admin-bundler")
  const responses = await Promise.all([
    compiler.buildPluginBackend(tsConfig),
    compiler.buildPluginAdminExtensions(bundler),
  ])

  if (responses.every((response) => response === true)) {
    process.exit(0)
  } else {
    process.exit(1)
  }
}
