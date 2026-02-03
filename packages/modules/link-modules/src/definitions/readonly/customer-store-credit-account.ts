import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const CustomerStoreCreditAccount: ModuleJoinerConfig = {
  isLink: true,
  isReadOnlyLink: true,
  extends: [
    {
      serviceName: Modules.LOYALTY,
      entity: "StoreCreditAccount",
      relationship: {
        serviceName: Modules.CUSTOMER,
        entity: "Customer",
        primaryKey: "id",
        foreignKey: "customer_id",
        alias: "customer",
        args: {
          methodSuffix: "Customers",
        },
      },
    },
    {
      serviceName: Modules.CUSTOMER,
      entity: "Customer",
      relationship: {
        serviceName: Modules.LOYALTY,
        entity: "StoreCreditAccount",
        primaryKey: "customer_id",
        foreignKey: "id",
        alias: "store_credit_accounts",
        args: {
          methodSuffix: "StoreCreditAccounts",
        },
        isList: true,
      },
    },
  ],
}
