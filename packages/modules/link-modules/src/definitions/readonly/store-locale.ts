import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const StoreLocales: ModuleJoinerConfig = {
  isLink: true,
  isReadOnlyLink: true,
  extends: [
    {
      serviceName: Modules.STORE,
      entity: "Store",
      relationship: {
        serviceName: Modules.TRANSLATION,
        entity: "Locale",
        primaryKey: "code",
        foreignKey: "supported_locales.locale_code",
        alias: "locale",
        args: {
          methodSuffix: "Locales",
        },
      },
    },
  ],
}
