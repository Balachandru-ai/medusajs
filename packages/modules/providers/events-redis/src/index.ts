import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import Loader from "./loaders"
import { RedisEventsProvider } from "./services/events-redis"

const services = [RedisEventsProvider]
const loaders = [Loader]

export default ModuleProvider(Modules.EVENT_BUS, {
  services,
  loaders,
})

export { RedisEventsProvider as RedisEventProvider } from "./services/events-redis"
export * from "./types"
