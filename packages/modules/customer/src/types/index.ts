import { Logger } from "@medusajs/framework/types"

import * as AddressServiceTypes from "./services/address"
import * as CustomerGroupServiceTypes from "./services/customer-group-customer"

export const ServiceTypes = {
  ...AddressServiceTypes,
  ...CustomerGroupServiceTypes,
}

export type InitializeModuleInjectableDependencies = {
  logger?: Logger
}
