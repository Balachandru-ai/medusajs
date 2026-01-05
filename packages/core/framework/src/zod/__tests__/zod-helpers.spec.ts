import { MedusaError } from "@medusajs/utils"
import { z } from "zod"
import { zodValidator } from "../zod-helpers"

describe("zodValidator", () => {
  describe("error formatting", () => {
    it("should format required field errors", async () => {
      const schema = z.object({
        name: z.string(),
      })

      await expect(zodValidator(schema, {})).rejects.toThrow(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Invalid request: Field 'name' is required"
        )
      )
    })

    it("should format invalid type errors", async () => {
      const schema = z.object({
        count: z.number(),
      })

      await expect(
        zodValidator(schema, { count: "not a number" })
      ).rejects.toThrow(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Invalid request: Expected type: 'number' for field 'count', got: 'not a number'"
        )
      )
    })

    it("should format invalid value errors with enum", async () => {
      const schema = z.object({
        status: z.enum(["active", "inactive"]),
      })

      await expect(zodValidator(schema, { status: "invalid" })).rejects.toThrow(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Invalid request: Expected: 'active, inactive' for field 'status', but got: 'invalid'"
        )
      )
    })

    it("should format unrecognized keys errors", async () => {
      const schema = z.object({
        name: z.string(),
      })

      await expect(
        zodValidator(schema, { name: "test", extra: "field" })
      ).rejects.toThrow(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Invalid request: Unrecognized fields: 'extra'"
        )
      )
    })

    it("should preserve parent path in union errors", async () => {
      const geoZoneSchema = z.object({
        type: z.enum(["country", "province"]),
        country_code: z.string(),
      })

      const schema = z.object({
        geo_zones: z.array(geoZoneSchema),
      })

      // Missing type field at index 2
      await expect(
        zodValidator(schema, {
          geo_zones: [
            { type: "country", country_code: "US" },
            { type: "province", country_code: "CA" },
            { country_code: "UK" }, // missing type
          ],
        })
      ).rejects.toThrow(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Invalid request: Field 'geo_zones, 2, type' is required"
        )
      )
    })

    it("should handle discriminated union with invalid type value", async () => {
      // This matches the actual geo_zones schema structure with z.union of z.literal types
      const geoZoneCountrySchema = z.object({
        type: z.literal("country"),
        country_code: z.string(),
      })

      const geoZoneProvinceSchema = z.object({
        type: z.literal("province"),
        country_code: z.string(),
        province_code: z.string(),
      })

      const schema = z.object({
        geo_zones: z.array(
          z.union([geoZoneCountrySchema, geoZoneProvinceSchema])
        ),
      })

      await expect(
        zodValidator(schema, {
          geo_zones: [
            { type: "country", country_code: "US" },
            { type: "province", country_code: "CA", province_code: "ON" },
            { type: "region", country_code: "UK" }, // invalid type
          ],
        })
      ).rejects.toThrow(/geo_zones.*2.*type/)
    })

    it("should preserve parent path in nested union errors", async () => {
      const addressSchema = z.object({
        street: z.string(),
        city: z.string(),
      })

      const locationSchema = z.object({
        name: z.string(),
        address: addressSchema,
      })

      const schema = z.object({
        locations: z.array(locationSchema),
      })

      await expect(
        zodValidator(schema, {
          locations: [
            { name: "HQ", address: { street: "123 Main", city: "NYC" } },
            { name: "Branch", address: { street: "456 Oak" } }, // missing city
          ],
        })
      ).rejects.toThrow(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Invalid request: Field 'locations, 1, address, city' is required"
        )
      )
    })

    it("should format too_small errors", async () => {
      const schema = z.object({
        count: z.number().min(5),
      })

      await expect(zodValidator(schema, { count: 2 })).rejects.toThrow(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Invalid request: Value for field 'count' too small, expected at least: '5'"
        )
      )
    })

    it("should format too_big errors", async () => {
      const schema = z.object({
        count: z.number().max(10),
      })

      await expect(zodValidator(schema, { count: 15 })).rejects.toThrow(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Invalid request: Value for field 'count' too big, expected at most: '10'"
        )
      )
    })

    it("should limit error messages to 3 issues", async () => {
      const schema = z.object({
        a: z.string(),
        b: z.string(),
        c: z.string(),
        d: z.string(),
        e: z.string(),
      })

      try {
        await zodValidator(schema, {})
        fail("Expected error to be thrown")
      } catch (err) {
        const error = err as MedusaError
        // Should only contain 3 error messages separated by "; "
        const messageCount = error.message.split("; ").length
        expect(messageCount).toBeLessThanOrEqual(3)
      }
    })
  })
})
