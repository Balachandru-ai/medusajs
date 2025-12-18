import { Compiler } from "@medusajs/framework/build-tools"
import { MedusaApp, MedusaModule } from "@medusajs/framework/modules-sdk"
import {
  ContainerRegistrationKeys,
  FileSystem,
  generateContainerTypes,
  getResolvedPlugins,
  gqlSchemaToTypes,
  mergePluginModules,
  validateModuleName,
} from "@medusajs/framework/utils"
import path from "path"
import { initializeContainer } from "../loaders"
import { MedusaAppLoader } from "@medusajs/framework"

export default async function build({
  directory,
  adminOnly,
  types,
}: {
  directory: string
  adminOnly: boolean
  types?: boolean
}) {
  const container = await initializeContainer(directory, {
    skipDbConnection: true,
  })
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (types) {
    logger.info("Generating types...")

    const configModule = container.resolve(
      ContainerRegistrationKeys.CONFIG_MODULE
    )

    const plugins = await getResolvedPlugins(directory, configModule, true)
    mergePluginModules(configModule, plugins)

    Object.keys(configModule.modules ?? {}).forEach((key) => {
      validateModuleName(key)
    })

    const { gqlSchema, modules } = await new MedusaAppLoader().load({
      registerInContainer: false,
      migrationOnly: true,
    })

    const typesDirectory = path.join(directory, ".medusa/types")

    /**
     * Cleanup existing types directory before creating new artifacts
     */
    await new FileSystem(typesDirectory).cleanup({ recursive: true })

    await generateContainerTypes(modules, {
      outputDir: typesDirectory,
      interfaceName: "ModuleImplementations",
    })
    logger.debug("Generated container types")

    if (gqlSchema) {
      await gqlSchemaToTypes({
        outputDir: typesDirectory,
        filename: "query-entry-points",
        interfaceName: "RemoteQueryEntryPoints",
        schema: gqlSchema,
        joinerConfigs: MedusaModule.getAllJoinerConfigs(),
      })
      logger.debug("Generated modules types")
    }

    logger.info("Types generated successfully")
  }

  logger.info("Starting build...")
  const compiler = new Compiler(directory, logger)

  const tsConfig = await compiler.loadTSConfigFile()
  if (!tsConfig) {
    logger.error("Unable to compile application")
    process.exit(1)
  }

  const promises: Promise<boolean>[] = []
  if (!adminOnly) {
    promises.push(compiler.buildAppBackend(tsConfig))
  }

  const bundler = await import("@medusajs/admin-bundler")
  promises.push(compiler.buildAppFrontend(adminOnly, tsConfig, bundler))
  const responses = await Promise.all(promises)

  const buildSucceeded = responses.every((response) => response === true)

  if (buildSucceeded) {
    process.exit(0)
  } else {
    process.exit(1)
  }
}
