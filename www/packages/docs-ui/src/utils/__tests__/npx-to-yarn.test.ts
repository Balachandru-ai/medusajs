import { describe, it, expect } from "vitest"
import { npxToYarn } from "../npx-to-yarn.js"

describe("npxToYarn", () => {
  describe("yarn conversion", () => {
    it("should convert basic npx command to yarn", () => {
      const result = npxToYarn("npx medusa db:migrate", "yarn")
      expect(result).toBe("yarn medusa db:migrate")
    })

    it("should convert npx command with multiple arguments", () => {
      const result = npxToYarn("npx medusa develop --port 9000", "yarn")
      expect(result).toBe("yarn medusa develop --port 9000")
    })

    it("should convert npx command with flags", () => {
      const result = npxToYarn("npx medusa user --email admin@test.com", "yarn")
      expect(result).toBe("yarn medusa user --email admin@test.com")
    })

    it("should handle npx command with leading/trailing whitespace", () => {
      const result = npxToYarn("  npx medusa db:migrate  ", "yarn")
      expect(result).toBe("yarn medusa db:migrate")
    })
  })

  describe("pnpm conversion", () => {
    it("should convert basic npx command to pnpm", () => {
      const result = npxToYarn("npx medusa db:migrate", "pnpm")
      expect(result).toBe("pnpm medusa db:migrate")
    })

    it("should convert npx command with multiple arguments", () => {
      const result = npxToYarn("npx medusa develop --port 9000", "pnpm")
      expect(result).toBe("pnpm medusa develop --port 9000")
    })

    it("should convert npx command with flags", () => {
      const result = npxToYarn("npx medusa user --email admin@test.com", "pnpm")
      expect(result).toBe("pnpm medusa user --email admin@test.com")
    })

    it("should handle npx command with leading/trailing whitespace", () => {
      const result = npxToYarn("  npx medusa db:migrate  ", "pnpm")
      expect(result).toBe("pnpm medusa db:migrate")
    })
  })

  describe("edge cases", () => {
    it("should return original command if it does not start with npx", () => {
      const result = npxToYarn("npm install medusa", "yarn")
      expect(result).toBe("npm install medusa")
    })

    it("should handle command with only npx and package name", () => {
      const result = npxToYarn("npx medusa", "yarn")
      expect(result).toBe("yarn medusa")
    })

    it("should preserve command structure with special characters", () => {
      const result = npxToYarn("npx medusa db:seed --file=./data.json", "pnpm")
      expect(result).toBe("pnpm medusa db:seed --file=./data.json")
    })

    it("should handle command with path separators", () => {
      const result = npxToYarn("npx @medusajs/medusa-cli develop", "yarn")
      expect(result).toBe("yarn @medusajs/medusa-cli develop")
    })
  })
})
