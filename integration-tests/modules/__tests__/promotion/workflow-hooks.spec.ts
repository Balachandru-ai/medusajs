import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  updateCartPromotionsWorkflow,
  completeCartWorkflow,
} from "@medusajs/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"

jest.setTimeout(200000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("Campaign Budget Custom Attributes Workflow Hooks", () => {
      beforeAll(() => {
        updateCartPromotionsWorkflow.hooks.getCustomCampaignBudgetAttributes(
          ({ cart }) => {
            return new StepResponse({
              account_id: cart.metadata?.account_id || null,
            })
          }
        )

        completeCartWorkflow.hooks.getCustomCampaignBudgetAttributesForRegistration(
          ({ cart }) => {
            return new StepResponse({
              account_id: cart.metadata?.account_id || null,
            })
          }
        )
      })

      it.todo("should merge custom attributes with default context")

      it.todo("should use custom attribute for budget tracking")

      it.todo("should throw error when custom attribute is missing")
    })
  },
})
