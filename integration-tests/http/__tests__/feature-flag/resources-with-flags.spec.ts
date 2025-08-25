import { MedusaWorkflow } from "@medusajs/framework/workflows-sdk"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import path from "path"

jest.setTimeout(100000)

medusaIntegrationTestRunner({
  medusaConfigFile: path.join(__dirname, "../../__fixtures__/feature-flag"),
  env: {
    CUSTOM_FF: true,
  },
  testSuite: ({ api }) => {
    describe("Resources loaded with feature flags", () => {
      it("should load workflow when feature flag is enabled", async () => {
        expect(MedusaWorkflow.getWorkflow("test-workflow")).toBeDefined()
      })

      it("should load scheduled job when feature flag is enabled", async () => {
        expect(
          MedusaWorkflow.getWorkflow("job-greeting-every-second")
        ).toBeDefined()
      })

      it("should load endpoint when feature flag is enabled", async () => {
        expect((await api.get("/custom")).status).toBe(200)
      })
    })
  },
})
