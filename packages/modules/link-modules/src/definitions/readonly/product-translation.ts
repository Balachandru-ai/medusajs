import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const TRANSLATION_MODULE = "translation"

export const ProductTranslation: ModuleJoinerConfig = {
  isLink: true,
  isReadOnlyLink: true,
  extends: [
    {
      serviceName: Modules.PRODUCT,
      entity: "Product",
      relationship: {
        serviceName: TRANSLATION_MODULE,
        entity: "Translation",
        primaryKey: "entity_id",
        foreignKey: "id",
        alias: "translations",
        isList: true,
        args: {
          methodSuffix: "Translations",
        },
      },
    },
    {
      serviceName: Modules.PRODUCT,
      entity: "ProductVariant",
      relationship: {
        serviceName: TRANSLATION_MODULE,
        entity: "Translation",
        primaryKey: "entity_id",
        foreignKey: "id",
        alias: "translations",
        isList: true,
        args: {
          methodSuffix: "Translations",
        },
      },
    },
    {
      serviceName: Modules.PRODUCT,
      entity: "ProductCategory",
      relationship: {
        serviceName: TRANSLATION_MODULE,
        entity: "Translation",
        primaryKey: "entity_id",
        foreignKey: "id",
        alias: "translations",
        isList: true,
        args: {
          methodSuffix: "Translations",
        },
      },
    },
    {
      serviceName: Modules.PRODUCT,
      entity: "ProductCollection",
      relationship: {
        serviceName: TRANSLATION_MODULE,
        entity: "Translation",
        primaryKey: "entity_id",
        foreignKey: "id",
        alias: "translations",
        isList: true,
        args: {
          methodSuffix: "Translations",
        },
      },
    },
    {
      serviceName: Modules.PRODUCT,
      entity: "ProductTag",
      relationship: {
        serviceName: TRANSLATION_MODULE,
        entity: "Translation",
        primaryKey: "entity_id",
        foreignKey: "id",
        alias: "translations",
        isList: true,
        args: {
          methodSuffix: "Translations",
        },
      },
    },
    {
      serviceName: Modules.PRODUCT,
      entity: "ProductType",
      relationship: {
        serviceName: TRANSLATION_MODULE,
        entity: "Translation",
        primaryKey: "entity_id",
        foreignKey: "id",
        alias: "translations",
        isList: true,
        args: {
          methodSuffix: "Translations",
        },
      },
    },
    {
      serviceName: Modules.PRODUCT,
      entity: "ProductOption",
      relationship: {
        serviceName: TRANSLATION_MODULE,
        entity: "Translation",
        primaryKey: "entity_id",
        foreignKey: "id",
        alias: "translations",
        isList: true,
        args: {
          methodSuffix: "Translations",
        },
      },
    },
    {
      serviceName: Modules.PRODUCT,
      entity: "ProductOptionValue",
      relationship: {
        serviceName: TRANSLATION_MODULE,
        entity: "Translation",
        primaryKey: "entity_id",
        foreignKey: "id",
        alias: "translations",
        isList: true,
        args: {
          methodSuffix: "Translations",
        },
      },
    },
    {
      serviceName: TRANSLATION_MODULE,
      entity: "Translation",
      relationship: {
        serviceName: Modules.PRODUCT,
        entity: "Product",
        primaryKey: "id",
        foreignKey: "entity_id",
        alias: "product",
        args: {
          methodSuffix: "Products",
        },
      },
    },
  ],
}
