import { Module, Modules } from "@medusajs/framework/utils"
import CartModuleService from "#services/cart-module"

export default Module(Modules.CART, {
  service: CartModuleService,
})
