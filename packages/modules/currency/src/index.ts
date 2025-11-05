import CurrencyModuleService from "#services/currency-module-service"
import initialDataLoader from "./loaders/initial-data"
import { Module, Modules } from "@medusajs/framework/utils"

const service = CurrencyModuleService
const loaders = [initialDataLoader]

export default Module(Modules.CURRENCY, {
  service,
  loaders,
})
