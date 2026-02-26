import "./types"
import { Module, Modules } from "@medusajs/framework/utils"
import { default as loadProviders } from "./loaders/providers"
import EventsModuleService from "./services/event-module"

export default Module(Modules.EVENT_BUS, {
  service: EventsModuleService,
  loaders: [loadProviders],
})

export { EventModuleOptions } from "./types"
