import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { MEDUSA_SKIP_FILE, Modules } from "@medusajs/framework/utils"

export const StoreLocales: ModuleJoinerConfig = {
  [MEDUSA_SKIP_FILE]: process.env.MEDUSA_FF_TRANSLATION !== "true",
  isLink: true,
  isReadOnlyLink: true,
  extends: [
    {
      serviceName: Modules.STORE,
      entity: "StoreLocale",
      relationship: {
        serviceName: Modules.TRANSLATION,
        entity: "Locale",
        primaryKey: "code",
        foreignKey: "locale_code",
        alias: "locale",
        args: {
          methodSuffix: "Locales",
        },
      },
    },
  ],
} as ModuleJoinerConfig
