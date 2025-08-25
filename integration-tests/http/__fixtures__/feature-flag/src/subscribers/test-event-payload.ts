import { defineFileConfig, FeatureFlag } from "@medusajs/framework/utils"

const testProductCreatedHandlerMock = jest.fn()

export default testProductCreatedHandlerMock

export const config = {
  event: "product.created",
}

defineFileConfig({
  isDisabled: () => !FeatureFlag.isFeatureEnabled("custom_ff"),
})
