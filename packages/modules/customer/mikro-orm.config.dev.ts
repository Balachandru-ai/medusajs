import Address from "#models/address"
import CustomerGroupCustomer from "#models/customer-group-customer"
import CustomerGroup from "#models/customer-group"
import Customer from "#models/customer"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.CUSTOMER, {
  entities: [Address, CustomerGroupCustomer, CustomerGroup, Customer],
})
