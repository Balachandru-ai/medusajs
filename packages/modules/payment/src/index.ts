import PaymentModuleService from "#services/payment-module"
import loadProviders from "#loaders/providers"
import { Module, Modules } from "@medusajs/framework/utils"

export default Module(Modules.PAYMENT, {
  service: PaymentModuleService,
  loaders: [loadProviders],
})

export { PaymentModuleOptions } from "#types/index"
