import { MikroOrmBaseRepository as BaseRepository } from "@medusajs/framework/utils"
import { getLinkRepository } from "#repositories/link"
import LinkService from "#services/link"
import { getModuleService } from "#services/dynamic-service-class"

import {
  InternalModuleDeclaration,
  LoaderOptions,
  ModuleJoinerConfig,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import {
  composeLinkName,
  composeTableName,
  simpleHash,
  toPascalCase,
} from "@medusajs/framework/utils"
import { asClass, asValue } from "@medusajs/framework/awilix"
export function containerLoader(entity, joinerConfig: ModuleJoinerConfig) {
  return async (
    {
      options,
      container,
    }: LoaderOptions<
      | ModulesSdkTypes.ModuleServiceInitializeOptions
      | ModulesSdkTypes.ModuleServiceInitializeCustomDataLayerOptions
    >,
    moduleDeclaration?: InternalModuleDeclaration
  ): Promise<void> => {
    const [primary, foreign] = joinerConfig.relationships!

    const serviceName = !joinerConfig.isReadOnlyLink
      ? joinerConfig.serviceName ??
        composeLinkName(
          primary.serviceName,
          primary.foreignKey,
          foreign.serviceName,
          foreign.foreignKey
        )
      : simpleHash(JSON.stringify(joinerConfig.extends))

    const entityName = toPascalCase(
      "Link_" +
        (joinerConfig.databaseConfig?.tableName ??
          composeTableName(
            primary.serviceName,
            primary.foreignKey,
            foreign.serviceName,
            foreign.foreignKey
          ))
    )

    container.register({
      joinerConfig: asValue(joinerConfig),
      primaryKey: asValue(primary.foreignKey.split(",")),
      foreignKey: asValue(foreign.foreignKey),
      extraFields: asValue(
        Object.keys(joinerConfig.databaseConfig?.extraFields || {})
      ),

      linkModuleService: asClass(getModuleService(joinerConfig)).singleton(),
      linkService: asClass(LinkService).singleton(),

      baseRepository: asClass(BaseRepository).singleton(),
      linkRepository: asClass(getLinkRepository(entity)).singleton(),
      entityName: asValue(entityName),
      serviceName: asValue(serviceName),
    })
  }
}
