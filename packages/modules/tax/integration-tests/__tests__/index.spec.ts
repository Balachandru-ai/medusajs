import {
  ITaxModuleService,
  ITaxProvider,
  TaxTypes,
} from "@medusajs/framework/types"
import { Module, Modules, toMikroORMEntity } from "@medusajs/framework/utils"
import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { TaxModuleService } from "@services"
import { setupTaxStructure } from "../utils/setup-tax-structure"

/**
 * Mock tax provider that returns TaxLinesResult with sourceMetadata.
 * Used to test that the tax module properly handles providers that
 * return the new TaxLinesResult format.
 */
class MockMetadataProvider implements ITaxProvider {
  static identifier = "mock-metadata"

  getIdentifier() {
    return MockMetadataProvider.identifier
  }

  async getTaxLines(
    itemLines: TaxTypes.ItemTaxCalculationLine[],
    shippingLines: TaxTypes.ShippingTaxCalculationLine[],
    _context: TaxTypes.TaxCalculationContext
  ): Promise<TaxTypes.TaxLinesResult> {
    const taxLines: (TaxTypes.ItemTaxLineDTO | TaxTypes.ShippingTaxLineDTO)[] =
      []

    for (const itemLine of itemLines) {
      taxLines.push({
        rate_id: itemLine.rates[0]?.id,
        rate: 10,
        name: "Mock Tax",
        code: "MOCK",
        line_item_id: itemLine.line_item.id,
        provider_id: `tp_${this.getIdentifier()}`,
      })
    }

    for (const shippingLine of shippingLines) {
      taxLines.push({
        rate_id: shippingLine.rates[0]?.id,
        rate: 5,
        name: "Mock Shipping Tax",
        code: "MOCK_SHIP",
        shipping_line_id: shippingLine.shipping_line.id,
        provider_id: `tp_${this.getIdentifier()}`,
      })
    }

    return {
      taxLines,
      sourceMetadata: {
        mock_calculation_id: "calc_123",
        mock_provider: "mock-metadata",
        mock_timestamp: new Date().toISOString(),
      },
    }
  }
}

jest.setTimeout(30000)

moduleIntegrationTestRunner<ITaxModuleService>({
  moduleName: Modules.TAX,
  testSuite: ({ service }) => {
    describe("TaxModuleService", function () {
      it(`should export the appropriate linkable configuration`, () => {
        const linkable = Module(toMikroORMEntity(Modules.TAX), {
          service: TaxModuleService,
        }).linkable

        expect(Object.keys(linkable)).toEqual([
          "taxRate",
          "taxRegion",
          "taxRateRule",
          "taxProvider",
        ])

        Object.keys(linkable).forEach((key) => {
          delete linkable[key].toJSON
        })

        expect(linkable).toEqual({
          taxRate: {
            id: {
              linkable: "tax_rate_id",
              entity: "TaxRate",
              primaryKey: "id",
              serviceName: "tax",
              field: "taxRate",
            },
          },
          taxRegion: {
            id: {
              linkable: "tax_region_id",
              entity: "TaxRegion",
              primaryKey: "id",
              serviceName: "tax",
              field: "taxRegion",
            },
          },
          taxRateRule: {
            id: {
              linkable: "tax_rate_rule_id",
              entity: "TaxRateRule",
              primaryKey: "id",
              serviceName: "tax",
              field: "taxRateRule",
            },
          },
          taxProvider: {
            id: {
              linkable: "tax_provider_id",
              entity: "TaxProvider",
              primaryKey: "id",
              serviceName: "tax",
              field: "taxProvider",
            },
          },
        })
      })

      it("should create tax region", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST",
          },
        })

        expect(region).toEqual(
          expect.objectContaining({
            id: region.id,
            country_code: "us",
          })
        )
      })

      it("should create two tax regions with the same country code but different province", async () => {
        const regionOne = await service.createTaxRegions({
          country_code: "US",
          province_code: "CA",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST",
          },
        })

        const regionTwo = await service.createTaxRegions({
          country_code: "US",
          province_code: "NY",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST",
          },
        })

        expect(regionOne).toEqual(
          expect.objectContaining({
            id: regionOne.id,
            country_code: "us",
            province_code: "ca",
          })
        )

        expect(regionTwo).toEqual(
          expect.objectContaining({
            id: regionTwo.id,
            country_code: "us",
            province_code: "ny",
          })
        )
      })

      it("should create two tax regions in a child-parent-like relationship", async () => {
        const regionOne = await service.createTaxRegions({
          country_code: "US",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST",
          },
        })

        const regionTwo = await service.createTaxRegions({
          country_code: "US",
          parent_id: regionOne.id,
          province_code: "NY",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST",
          },
        })

        expect(regionOne).toEqual(
          expect.objectContaining({
            id: regionOne.id,
            country_code: "us",
            province_code: null,
          })
        )

        expect(regionTwo).toEqual(
          expect.objectContaining({
            id: regionTwo.id,
            country_code: "us",
            province_code: "ny",
          })
        )
      })

      it("should create three tax regions in a child-parent-like relationship", async () => {
        const regionOne = await service.createTaxRegions({
          country_code: "US",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST",
          },
        })

        const regionTwo = await service.createTaxRegions({
          country_code: "US",
          parent_id: regionOne.id,
          province_code: "NY",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST",
          },
        })

        const regionThree = await service.createTaxRegions({
          country_code: "US",
          parent_id: regionOne.id,
          province_code: "NE",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST",
          },
        })

        expect(regionOne).toEqual(
          expect.objectContaining({
            id: regionOne.id,
            country_code: "us",
            province_code: null,
          })
        )

        expect(regionTwo).toEqual(
          expect.objectContaining({
            id: regionTwo.id,
            country_code: "us",
            province_code: "ny",
          })
        )

        expect(regionThree).toEqual(
          expect.objectContaining({
            id: regionThree.id,
            country_code: "us",
            province_code: "ne",
          })
        )
      })

      it("should throw when creating a tax region with a country code of an existing region", async () => {
        await service.createTaxRegions({
          country_code: "US",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST",
          },
        })

        const error = await service
          .createTaxRegions({
            country_code: "US",
            default_tax_rate: {
              name: "Test Rate",
              rate: 0.2,
              code: "TEST",
            },
          })
          .catch((e) => e)

        expect(error.message).toEqual(
          "Tax region with country_code: us, already exists."
        )
      })

      it("should throw when creating a tax region with a country code and province code of an existing region", async () => {
        await service.createTaxRegions({
          country_code: "US",
          province_code: "CA",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST",
          },
        })

        const error = await service
          .createTaxRegions({
            country_code: "US",
            province_code: "CA",
            default_tax_rate: {
              name: "Test Rate",
              rate: 0.2,
              code: "TEST",
            },
          })
          .catch((e) => e)

        expect(error.message).toEqual(
          "Tax region with country_code: us, province_code: ca, already exists."
        )
      })

      it("should create tax rates and update them", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST-CODE",
          },
        })

        const rate = await service.createTaxRates({
          tax_region_id: region.id,
          name: "Shipping Rate",
          code: "test",
          rate: 8.23,
        })

        const updatedRate = await service.updateTaxRates(rate.id, {
          name: "Updated Rate",
          code: "TEST",
          rate: 8.25,
        })

        expect(updatedRate).toEqual(
          expect.objectContaining({
            tax_region_id: region.id,
            rate: 8.25,
            name: "Updated Rate",
            code: "TEST",
            is_default: false,
          })
        )

        const updatedDefaultRate = await service.updateTaxRates(
          { tax_region_id: region.id, is_default: true },
          { rate: 2 }
        )

        expect(updatedDefaultRate).toEqual([
          expect.objectContaining({
            tax_region_id: region.id,
            rate: 2,
            name: "Test Rate",
            code: "TEST-CODE",
            is_default: true,
          }),
        ])

        const rates = await service.listTaxRates()
        expect(rates).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              tax_region_id: region.id,
              rate: 2,
              name: "Test Rate",
              code: "TEST-CODE",
              is_default: true,
            }),
            expect.objectContaining({
              tax_region_id: region.id,
              rate: 8.25,
              name: "Updated Rate",
              code: "TEST",
              is_default: false,
            }),
          ])
        )
      })

      it("should update tax rates with rules", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST-CODE",
          },
        })

        const rate = await service.createTaxRates({
          tax_region_id: region.id,
          name: "Shipping Rate",
          code: "test",
          rate: 8.23,
        })

        await service.updateTaxRates(rate.id, {
          name: "Updated Rate",
          code: "TEST",
          rate: 8.25,
          rules: [
            { reference: "product", reference_id: "product_id_1" },
            { reference: "product_type", reference_id: "product_type_id" },
          ],
        })

        const rules = await service.listTaxRateRules({ tax_rate_id: rate.id })

        expect(rules).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              reference: "product",
              reference_id: "product_id_1",
            }),
            expect.objectContaining({
              reference: "product_type",
              reference_id: "product_type_id",
            }),
          ])
        )

        await service.updateTaxRates(rate.id, {
          rules: [
            { reference: "product", reference_id: "product_id_1" },
            { reference: "product", reference_id: "product_id_2" },
            { reference: "product_type", reference_id: "product_type_id_2" },
            { reference: "product_type", reference_id: "product_type_id_3" },
          ],
        })

        const rulesWithDeletes = await service.listTaxRateRules(
          { tax_rate_id: rate.id },
          { withDeleted: true }
        )

        expect(rulesWithDeletes).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              reference: "product",
              reference_id: "product_id_2",
            }),
            expect.objectContaining({
              reference: "product_type",
              reference_id: "product_type_id_2",
            }),
            expect.objectContaining({
              reference: "product_type",
              reference_id: "product_type_id_3",
            }),
            expect.objectContaining({
              reference: "product",
              reference_id: "product_id_1",
              deleted_at: expect.any(Date),
            }),
            expect.objectContaining({
              reference: "product_type",
              reference_id: "product_type_id",
              deleted_at: expect.any(Date),
            }),
          ])
        )
      })

      it("should create a tax region", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
          default_tax_rate: {
            code: "TEST",
            name: "Test Rate",
            rate: 0.2,
          },
        })

        const [provinceRegion] = await service.createTaxRegions([
          {
            country_code: "US",
            province_code: "CA",
            parent_id: region.id,
            default_tax_rate: {
              code: "TEST",
              name: "CA Rate",
              rate: 8.25,
            },
          },
        ])

        const listedRegions = await service.listTaxRegions()
        expect(listedRegions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: region.id,
              country_code: "us",
              province_code: null,
              parent_id: null,
            }),
            expect.objectContaining({
              id: provinceRegion.id,
              country_code: "us",
              province_code: "ca",
              parent_id: region.id,
            }),
          ])
        )

        const rates = await service.listTaxRates()
        expect(rates).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              tax_region_id: region.id,
              rate: 0.2,
              name: "Test Rate",
              is_default: true,
            }),
            expect.objectContaining({
              tax_region_id: provinceRegion.id,
              rate: 8.25,
              name: "CA Rate",
              is_default: true,
            }),
          ])
        )
      })

      it("should create a tax rate rule", async () => {
        const [region] = await service.createTaxRegions([
          {
            country_code: "US",
            default_tax_rate: {
              code: "TEST",
              name: "Test Rate",
              rate: 0.2,
            },
          },
        ])

        const rate = await service.createTaxRates({
          tax_region_id: region.id,
          name: "Shipping Rate",
          rate: 8.23,
          code: "TEST-CODE",
        })

        await service.createTaxRateRules([
          {
            tax_rate_id: rate.id,
            reference: "product",
            reference_id: "prod_1234",
          },
        ])

        const listedRules = await service.listTaxRateRules(
          {},
          {
            relations: ["tax_rate"],
          }
        )
        expect(listedRules).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              reference: "product",
              reference_id: "prod_1234",
              tax_rate: expect.objectContaining({
                tax_region_id: region.id,
                name: "Shipping Rate",
                rate: 8.23,
              }),
            }),
          ])
        )
      })

      it("applies specific product rules at the province level", async () => {
        await setupTaxStructure(service)
        const item = {
          id: "item_test",
          product_id: "product_id_1", // Matching the specific product rate for CA province
          quantity: 1,
        }
        const calculationContext = {
          address: {
            country_code: "US",
            province_code: "CA",
          },
        }

        const taxLines = await service.getTaxLines([item], calculationContext)

        expect(taxLines).toEqual([
          expect.objectContaining({
            rate_id: expect.any(String),
            rate: 3, // Expecting the reduced rate for specific products in CA
            code: "CAREDUCE_PROD",
            name: "CA Reduced Rate for Products",
          }),
        ])
      })

      it("applies specific product type rules at the province level", async () => {
        await setupTaxStructure(service)
        const item = {
          id: "item_test",
          product_id: "product_id_unknown", // This product does not have a specific rule
          product_type_id: "product_type_id_1", // Matching the specific product type rate for CA province
          quantity: 1,
        }
        const calculationContext = {
          address: {
            country_code: "US",
            province_code: "CA",
          },
        }

        const taxLines = await service.getTaxLines([item], calculationContext)

        expect(taxLines).toEqual([
          expect.objectContaining({
            rate_id: expect.any(String),
            rate: 1, // Expecting the reduced rate for specific product types in CA
            code: "CAREDUCE_TYPE",
            name: "CA Reduced Rate for Product Type",
          }),
        ])
      })

      it("applies specific product type rules at the province level", async () => {
        await setupTaxStructure(service)
        const item = {
          id: "item_test",
          product_id: "product_id_unknown", // This product does not have a specific rule
          product_type_id: "product_type_id_1", // Matching the specific product type rate for CA province
          quantity: 1,
        }
        const calculationContext = {
          address: {
            country_code: "US",
            province_code: "CA",
          },
        }

        const taxLines = await service.getTaxLines([item], calculationContext)

        expect(taxLines).toEqual([
          expect.objectContaining({
            rate_id: expect.any(String),
            rate: 1, // Expecting the reduced rate for specific product types in CA
            code: "CAREDUCE_TYPE",
            name: "CA Reduced Rate for Product Type",
          }),
        ])
      })

      it("applies default province rules when no specific product or product type rule matches", async () => {
        await setupTaxStructure(service)
        const item = {
          id: "item_test",
          product_id: "product_id_unknown",
          quantity: 1,
        }
        const calculationContext = {
          address: {
            country_code: "US",
            province_code: "NY", // Testing with NY to apply the default provincial rate
          },
        }

        const taxLines = await service.getTaxLines([item], calculationContext)

        expect(taxLines).toEqual([
          expect.objectContaining({
            rate_id: expect.any(String),
            rate: 6, // Expecting the default rate for NY province
            code: "NYDEFAULT",
            name: "NY Default Rate",
          }),
        ])
      })

      it("applies specific product rules at the country level when no province rate applies", async () => {
        await setupTaxStructure(service)
        const item = {
          id: "item_test",
          product_id: "product_id_4", // Assuming this ID now has a specific rule at the country level for Canada
          quantity: 1,
        }
        const calculationContext = {
          address: {
            country_code: "CA",
            province_code: "ON", // This province does not have a specific rule
          },
        }

        const taxLines = await service.getTaxLines([item], calculationContext)

        expect(taxLines).toEqual([
          expect.objectContaining({
            rate_id: expect.any(String),
            rate: 3, // Expecting the reduced rate for specific products in Canada
            code: "CAREDUCE_PROD_CA",
            name: "Canada Reduced Rate for Product",
          }),
        ])
      })

      it("applies default country rules when no specific product or product type rule matches", async () => {
        await setupTaxStructure(service)
        const item = {
          id: "item_test",
          product_id: "product_id_unknown",
          quantity: 1,
        }
        const calculationContext = {
          address: {
            country_code: "DE", // Testing with Germany to apply the default country rate
          },
        }

        const taxLines = await service.getTaxLines([item], calculationContext)

        expect(taxLines).toEqual([
          expect.objectContaining({
            rate_id: expect.any(String),
            rate: 19,
            code: "DE19",
            name: "Germany Default Rate",
          }),
        ])
      })

      it("prioritizes specific product rules over product type rules", async () => {
        await setupTaxStructure(service)

        const item = {
          id: "item_test",
          product_id: "product_id_1", // This product has a specific rule for product type and product
          product_type_id: "product_type_id_1", // This product type has a specific rule for product type
          quantity: 1,
        }
        const calculationContext = {
          address: {
            country_code: "US",
            province_code: "CA",
          },
        }

        const taxLines = await service.getTaxLines([item], calculationContext)

        expect(taxLines).toEqual([
          expect.objectContaining({
            rate_id: expect.any(String),
            rate: 3, // Expecting the reduced rate for specific products in CA
            code: "CAREDUCE_PROD",
            name: "CA Reduced Rate for Products",
          }),
        ])
      })

      it("prioritizes specific shipping rate over default rate", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
          provider_id: "tp_system",
          default_tax_rate: {
            code: "TEST",
            name: "Test Rate",
            rate: 5,
          },
        })

        const rate = await service.createTaxRates({
          tax_region_id: region.id,
          name: "Shipping Rate",
          code: "SHIPPING_TEST",
          rate: 2,
        })

        const item = {
          id: "shipping_test",
          shipping_option_id: "so_1234",
          quantity: 1,
        }

        const calculationContext = {
          address: {
            country_code: "US",
          },
        }

        let taxLines = await service.getTaxLines([item], calculationContext)

        expect(taxLines).toEqual([
          expect.objectContaining({
            rate_id: expect.any(String),
            rate: 5,
            code: "TEST",
            name: "Test Rate",
          }),
        ])

        await service.updateTaxRates(rate.id, {
          rules: [
            {
              reference: "shipping_option",
              reference_id: "so_1234",
            },
          ],
        })

        taxLines = await service.getTaxLines([item], calculationContext)

        expect(taxLines).toEqual([
          expect.objectContaining({
            rate_id: expect.any(String),
            rate: 2,
            code: "SHIPPING_TEST",
            name: "Shipping Rate",
          }),
        ])
      })

      it("should delete tax rate", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
        })

        const taxRate = await service.createTaxRates({
          tax_region_id: region.id,
          value: 10,
          code: "test",
          name: "test",
        })

        await service.deleteTaxRates(taxRate.id)

        const rates = await service.listTaxRates({ tax_region_id: region.id })

        expect(rates).toEqual([])
      })

      it("should soft delete tax rate", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
        })

        const taxRate = await service.createTaxRates({
          tax_region_id: region.id,
          value: 10,
          code: "test",
          name: "test",
        })

        await service.softDeleteTaxRates([taxRate.id])

        const rates = await service.listTaxRates(
          { tax_region_id: region.id },
          { withDeleted: true }
        )

        expect(rates).toEqual([
          expect.objectContaining({
            id: taxRate.id,
            deleted_at: expect.any(Date),
          }),
        ])
      })

      it("should delete a tax region and its rates", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
          default_tax_rate: {
            value: 2,
            code: "test",
            name: "default test",
          },
        })

        await service.createTaxRates({
          tax_region_id: region.id,
          value: 10,
          code: "test",
          name: "test",
        })

        await service.deleteTaxRegions(region.id)

        const taxRegions = await service.listTaxRegions()
        const rates = await service.listTaxRates()

        expect(taxRegions).toEqual([])
        expect(rates).toEqual([])
      })

      it("should soft delete a tax region and its rates", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
          default_tax_rate: {
            value: 2,
            code: "test",
            name: "default test",
          },
        })

        await service.createTaxRates({
          tax_region_id: region.id,
          value: 10,
          code: "test",
          name: "test",
        })

        await service.softDeleteTaxRegions([region.id])

        const taxRegions = await service.listTaxRegions(
          {},
          { withDeleted: true }
        )
        const rates = await service.listTaxRates({}, { withDeleted: true })

        expect(taxRegions).toEqual([
          expect.objectContaining({
            id: region.id,
            country_code: "us",
            deleted_at: expect.any(Date),
          }),
        ])
        expect(rates).toEqual([
          expect.objectContaining({
            deleted_at: expect.any(Date),
          }),
          expect.objectContaining({
            deleted_at: expect.any(Date),
          }),
        ])
      })

      it("should delete a tax rate and its rules", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
        })

        const rate = await service.createTaxRates({
          tax_region_id: region.id,
          value: 10,
          code: "test",
          name: "test",
          rules: [
            { reference: "product", reference_id: "product_id_1" },
            { reference: "product_type", reference_id: "product_type_id" },
          ],
        })

        await service.deleteTaxRates(rate.id)

        const taxRegions = await service.listTaxRegions()
        const rates = await service.listTaxRates()
        const rules = await service.listTaxRateRules()

        expect(taxRegions).toEqual([expect.objectContaining({ id: region.id })])
        expect(rates).toEqual([])
        expect(rules).toEqual([])
      })

      it("should soft delete a tax rate and its rules", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
        })

        const rate = await service.createTaxRates({
          tax_region_id: region.id,
          value: 10,
          code: "test",
          name: "test",
          rules: [
            { reference: "product", reference_id: "product_id_1" },
            { reference: "product_type", reference_id: "product_type_id" },
          ],
        })

        await service.softDeleteTaxRates(rate.id)

        const taxRegions = await service.listTaxRegions(
          {},
          { withDeleted: true }
        )
        const rates = await service.listTaxRates({}, { withDeleted: true })
        const rules = await service.listTaxRateRules({}, { withDeleted: true })

        expect(taxRegions).toEqual([
          expect.objectContaining({ id: region.id, deleted_at: null }),
        ])
        expect(rates).toEqual([
          expect.objectContaining({
            id: rate.id,
            deleted_at: expect.any(Date),
          }),
        ])
        expect(rules).toEqual([
          expect.objectContaining({
            tax_rate_id: rate.id,
            deleted_at: expect.any(Date),
          }),
          expect.objectContaining({
            tax_rate_id: rate.id,
            deleted_at: expect.any(Date),
          }),
        ])
      })

      it("should soft delete a tax rule", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
        })

        const rate = await service.createTaxRates({
          tax_region_id: region.id,
          value: 10,
          code: "test",
          name: "test",
        })

        const [ruleOne, ruleTwo] = await service.createTaxRateRules([
          {
            tax_rate_id: rate.id,
            reference: "product",
            reference_id: "product_id_1",
          },
          {
            tax_rate_id: rate.id,
            reference: "product_type",
            reference_id: "product_type_id",
          },
        ])

        await service.softDeleteTaxRateRules([ruleOne.id])

        const rules = await service.listTaxRateRules({}, { withDeleted: true })
        expect(rules).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: ruleOne.id,
              deleted_at: expect.any(Date),
            }),
            expect.objectContaining({
              id: ruleTwo.id,
              deleted_at: null,
            }),
          ])
        )

        const rateWithRules = await service.retrieveTaxRate(rate.id, {
          relations: ["rules"],
        })
        expect(rateWithRules.rules.length).toBe(1)

        // should be possible to add the rule back again
        await service.createTaxRateRules({
          tax_rate_id: rate.id,
          reference: ruleOne.reference,
          reference_id: ruleOne.reference_id,
        })

        const rateWithRulesAfterReAdd = await service.retrieveTaxRate(rate.id, {
          relations: ["rules"],
        })
        expect(rateWithRulesAfterReAdd.rules.length).toBe(2)
      })

      it("should fail on duplicate rules", async () => {
        const region = await service.createTaxRegions({
          country_code: "US",
        })

        await expect(
          service.createTaxRates({
            tax_region_id: region.id,
            value: 10,
            code: "test",
            name: "test",
            rules: [
              { reference: "product", reference_id: "product_id_1" },
              { reference: "product", reference_id: "product_id_1" },
            ],
          })
        ).rejects.toThrowError(
          /Tax rate rule with tax_rate_id: .*?, reference_id: product_id_1, already exists./
        )

        const rate = await service.createTaxRates({
          tax_region_id: region.id,
          value: 10,
          code: "test",
          name: "test",
          rules: [{ reference: "product", reference_id: "product_id_1" }],
        })

        await expect(
          service.createTaxRateRules({
            tax_rate_id: rate.id,
            reference: "product",
            reference_id: "product_id_1",
          })
        ).rejects.toThrowError(
          /Tax rate rule with tax_rate_id: .*?, reference_id: product_id_1, already exists./
        )
      })

      it("should fail to create province region belonging to a parent with non-matching country", async () => {
        const caRegion = await service.createTaxRegions({
          country_code: "CA",
        })
        await expect(
          service.createTaxRegions({
            country_code: "US", // This should be CA
            parent_id: caRegion.id,
            province_code: "QC",
          })
        ).rejects.toThrowError(
          `Province region must belong to a parent region with the same country code. You are trying to create a province region with (country: us, province: qc) but parent expects (country: ca)`
        )
      })

      it("should fail duplicate regions", async () => {
        await service.createTaxRegions({
          country_code: "CA",
        })

        await service.createTaxRegions({
          country_code: "CA",
          province_code: "QC",
        })

        await expect(
          service.createTaxRegions({
            country_code: "CA",
            province_code: "QC",
          })
        ).rejects.toThrowError(
          "Tax region with country_code: ca, province_code: qc, already exists."
        )
      })

      it("should fail to create region with non-existing parent", async () => {
        await expect(
          service.createTaxRegions({
            parent_id: "something random",
            country_code: "CA",
            province_code: "QC",
          })
        ).rejects.toThrowError(
          `Province region must belong to a parent region. You are trying to create a province region with (country: ca, province: qc) but parent does not exist`
        )
      })

      it("should fail to create two default tax rates", async () => {
        const rate = await service.createTaxRegions({
          country_code: "CA",
          default_tax_rate: {
            name: "Test Rate",
            rate: 0.2,
            code: "TEST-CODE",
          },
        })

        await expect(
          service.createTaxRates({
            tax_region_id: rate.id,
            name: "Shipping Rate",
            rate: 8.23,
            is_default: true,
            code: "TEST-CODE-2",
          })
        ).rejects.toThrowError(
          /Tax rate with tax_region_id: .*?, already exists./
        )
      })

      it("should delete all child regions when parent region is deleted", async () => {
        const region = await service.createTaxRegions({
          country_code: "CA",
        })
        const provinceRegion = await service.createTaxRegions({
          parent_id: region.id,
          country_code: "CA",
          province_code: "QC",
        })

        await service.deleteTaxRegions(region.id)

        const taxRegions = await service.listTaxRegions({
          id: provinceRegion.id,
        })

        expect(taxRegions).toEqual([])
      })

      it("should soft delete all child regions when parent region is deleted", async () => {
        const region = await service.createTaxRegions({
          country_code: "CA",
        })
        const provinceRegion = await service.createTaxRegions({
          parent_id: region.id,
          country_code: "CA",
          province_code: "QC",
        })

        await service.softDeleteTaxRegions([region.id])

        const taxRegions = await service.listTaxRegions(
          { id: provinceRegion.id },
          { withDeleted: true }
        )

        expect(taxRegions).toEqual([
          expect.objectContaining({
            id: provinceRegion.id,
            deleted_at: expect.any(Date),
          }),
        ])
      })

      it("should retrieve a tax module provider's service", async () => {
        const providerService = service.getProvider("tp_system")
        expect(providerService).toBeDefined()
        expect(providerService.getIdentifier()).toEqual("system")
      })

      describe("TaxLinesResult with sourceMetadata", () => {
        it("should return array when provider returns array (backward compatibility)", async () => {
          // The system provider returns arrays, not TaxLinesResult
          // This test verifies backward compatibility
          await service.createTaxRegions({
            country_code: "US",
            provider_id: "tp_system",
            default_tax_rate: {
              name: "Default Rate",
              rate: 10,
              code: "DEFAULT",
            },
          })

          const item = {
            id: "item_test",
            product_id: "product_123",
            quantity: 1,
          }

          const calculationContext = {
            address: {
              country_code: "US",
            },
          }

          const result = await service.getTaxLines([item], calculationContext)

          // The system provider returns an array, not TaxLinesResult
          expect(Array.isArray(result)).toBe(true)
          expect(result).toEqual([
            expect.objectContaining({
              rate: 10,
              code: "DEFAULT",
              name: "Default Rate",
              line_item_id: "item_test",
            }),
          ])
        })
      })
    })
  },
})

/**
 * Separate test runner for testing TaxLinesResult with a mock provider.
 * This requires injecting a custom provider into the container.
 */
moduleIntegrationTestRunner<ITaxModuleService>({
  moduleName: Modules.TAX,
  injectedDependencies: {
    tp_mock_metadata: new MockMetadataProvider(),
  },
  testSuite: ({ service }) => {
    describe("TaxModuleService - TaxLinesResult", function () {
      it("should return TaxLinesResult when provider returns metadata", async () => {
        // Create a region that uses our mock provider
        await service.createTaxRegions({
          country_code: "DE",
          provider_id: "tp_mock_metadata",
          default_tax_rate: {
            name: "Mock Rate",
            rate: 10,
            code: "MOCK",
          },
        })

        const item = {
          id: "item_test",
          product_id: "product_123",
          quantity: 1,
        }

        const calculationContext = {
          address: {
            country_code: "DE",
          },
        }

        const result = await service.getTaxLines([item], calculationContext)

        // The mock provider returns TaxLinesResult with sourceMetadata
        expect(Array.isArray(result)).toBe(false)
        expect(result).toHaveProperty("taxLines")
        expect(result).toHaveProperty("sourceMetadata")

        const taxLinesResult = result as TaxTypes.TaxLinesResult
        expect(taxLinesResult.taxLines).toEqual([
          expect.objectContaining({
            rate: 10,
            code: "MOCK",
            name: "Mock Tax",
            line_item_id: "item_test",
            provider_id: "tp_mock_metadata",
          }),
        ])
        expect(taxLinesResult.sourceMetadata).toEqual(
          expect.objectContaining({
            mock_calculation_id: "calc_123",
            mock_provider: "mock-metadata",
          })
        )
      })

      it("should return TaxLinesResult with shipping tax lines", async () => {
        await service.createTaxRegions({
          country_code: "FR",
          provider_id: "tp_mock_metadata",
          default_tax_rate: {
            name: "Mock Rate",
            rate: 5,
            code: "MOCK",
          },
        })

        const shippingItem = {
          id: "shipping_test",
          shipping_option_id: "so_123",
        }

        const calculationContext = {
          address: {
            country_code: "FR",
          },
        }

        const result = await service.getTaxLines(
          [shippingItem],
          calculationContext
        )

        expect(Array.isArray(result)).toBe(false)
        expect(result).toHaveProperty("taxLines")
        expect(result).toHaveProperty("sourceMetadata")

        const taxLinesResult = result as TaxTypes.TaxLinesResult
        expect(taxLinesResult.taxLines).toEqual([
          expect.objectContaining({
            rate: 5,
            code: "MOCK_SHIP",
            name: "Mock Shipping Tax",
            shipping_line_id: "shipping_test",
            provider_id: "tp_mock_metadata",
          }),
        ])
      })
    })
  },
})
