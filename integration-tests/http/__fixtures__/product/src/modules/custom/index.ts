import { Module } from "@medusajs/utils"
import CustomService, { CUSTOM_MODULE } from "./service"

export default Module(CUSTOM_MODULE, {
  service: CustomService,
})
