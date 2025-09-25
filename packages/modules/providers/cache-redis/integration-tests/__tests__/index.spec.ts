import { Modules } from "@medusajs/framework/utils"
import { moduleIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(10000)

moduleIntegrationTestRunner<any>({
  moduleName: Modules.CACHING,
  moduleOptions: {
    providers: [
      {
        id: "cache-memory",
        resolve: require.resolve("../../src"),
        is_default: true,
      },
    ],
  },
  testSuite: ({ service }) => {
    describe("Caching Module Service", () => {
      it("should run", async () => {
        expect(true).toBe(true)
      })
    })
  },
})
