import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import Loader from "./loaders"
import { RedisEventProvider } from "./services/event-redis"

const services = [RedisEventProvider]
const loaders = [Loader]

export default ModuleProvider(Modules.EVENT_BUS, {
  services,
  loaders,
})

export { RedisEventProvider } from "./services/event-redis"
export * from "./types"
