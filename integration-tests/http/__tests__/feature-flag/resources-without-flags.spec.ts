import { MedusaWorkflow } from "@medusajs/framework/workflows-sdk"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import path from "path"

jest.setTimeout(100000)

medusaIntegrationTestRunner({
  medusaConfigFile: path.join(__dirname, "../../__fixtures__/feature-flag"),
  testSuite: ({ api }) => {
    describe("Resources loaded without feature flags", () => {
      it("should not load workflow when feature flag is disabled", async () => {
        expect(MedusaWorkflow.getWorkflow("test-workflow")).toBeUndefined()
      })

      it("should not load endpoint when feature flag is enabled", async () => {
        expect(api.get("/custom")).rejects.toThrow()
      })
    })
  },
})
