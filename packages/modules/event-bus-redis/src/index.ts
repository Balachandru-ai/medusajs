import { ModuleExports } from "@medusajs/framework/types"
import Loader from "#loaders/index"
import RedisEventBusService from "./services/event-bus-redis"

const service = RedisEventBusService
const loaders = [Loader]

const moduleDefinition: ModuleExports = {
  service,
  loaders,
}

export default moduleDefinition
export * from "#initialize/index"
export * from "#types/index"
