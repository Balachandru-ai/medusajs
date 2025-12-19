import { LinkLoader, MedusaAppLoader } from "@medusajs/framework"
import { MedusaModule } from "@medusajs/framework/modules-sdk"
import {
  ContainerRegistrationKeys,
  generateContainerTypes,
  generatePolicyTypes,
  getResolvedPlugins,
  gqlSchemaToTypes,
  mergePluginModules,
  promiseAll,
  validateModuleName,
} from "@medusajs/framework/utils"
import { Logger, MedusaContainer } from "@medusajs/types"
import path, { join } from "path"

export async function generateTypes({
  directory,
  container,
  logger,
}: {
  directory: string
  container: MedusaContainer
  logger: Logger
}) {
  logger.info("Generating types...")

  const configModule = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  )

  const plugins = await getResolvedPlugins(directory, configModule, true)
  mergePluginModules(configModule, plugins)

  Object.keys(configModule.modules ?? {}).forEach((key) => {
    validateModuleName(key)
  })

  const linksSourcePaths = plugins.map((plugin) =>
    join(plugin.resolve, "links")
  )
  await new LinkLoader(linksSourcePaths, logger).load()

  const { gqlSchema, modules } = await new MedusaAppLoader().load({
    registerInContainer: false,
    migrationOnly: true,
  })

  const typesDirectory = path.join(directory, ".medusa/types")

  const fileGenPromises: Promise<void>[] = []

  fileGenPromises.push(
    generateContainerTypes(modules, {
      outputDir: typesDirectory,
      interfaceName: "ModuleImplementations",
    })
  )

  if (gqlSchema) {
    fileGenPromises.push(
      gqlSchemaToTypes({
        outputDir: typesDirectory,
        filename: "query-entry-points",
        interfaceName: "RemoteQueryEntryPoints",
        schema: gqlSchema,
        joinerConfigs: MedusaModule.getAllJoinerConfigs(),
      })
    )
  }

  fileGenPromises.push(
    generatePolicyTypes({
      outputDir: typesDirectory,
    })
  )

  await promiseAll(fileGenPromises)
  logger.info("Types generated successfully")
}
