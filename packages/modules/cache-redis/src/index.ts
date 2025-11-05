import { ModuleExports } from "@medusajs/framework/types"
import Loader from "./loaders"
import RedisCacheService from "#services/redis-cache"

const service = RedisCacheService
const loaders = [Loader]

const moduleDefinition: ModuleExports = {
  service,
  loaders,
}

export default moduleDefinition
export * from "./initialize"
export * from "./types"
