import "./types"
import { Module, Modules } from "@medusajs/framework/utils"
import { default as loadProviders } from "./loaders/providers"
import EventModuleService from "./services/event-module"

export default Module(Modules.EVENT_BUS, {
  service: EventModuleService,
  loaders: [loadProviders],
})

// Module options types
export { EventModuleOptions } from "./types"
