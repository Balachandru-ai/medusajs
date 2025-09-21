import { EntitySerializer, MikroORM } from "@mikro-orm/core"
import { defineConfig } from "@mikro-orm/postgresql"
import {
  Entity1WithUnDecoratedProp,
  Entity2WithUnDecoratedProp,
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "../__fixtures__/utils"
import { mikroOrmSerializer as mikroOrmSerializerOld } from "../mikro-orm-serializer-old"
import { mikroOrmSerializer } from "../mikro-orm-serializer"

jest.setTimeout(60000)

describe("mikroOrmSerializer", () => {
  beforeEach(async () => {
    await MikroORM.init(
      defineConfig({
        entities: [
          Entity1WithUnDecoratedProp,
          Entity2WithUnDecoratedProp,
          Product,
          ProductOption,
          ProductOptionValue,
          ProductVariant,
        ],
        user: "postgres",
        password: "",
        dbName: "test",
        connect: false,
      })
    )
  })

  it("should serialize an entity", async () => {
    const entity1 = new Entity1WithUnDecoratedProp({
      id: "1",
      deleted_at: null,
    })
    entity1.unknownProp = "calculated"

    const entity2 = new Entity2WithUnDecoratedProp({
      id: "2",
      deleted_at: null,
      entity1: entity1,
    })
    entity1.entity2.add(entity2)

    const serialized = mikroOrmSerializer(entity1, {
      preventCircularRef: false,
    })

    expect(serialized).toEqual({
      id: "1",
      deleted_at: null,
      unknownProp: "calculated",
      entity2: [
        {
          id: "2",
          deleted_at: null,
          entity1: {
            id: "1",
            deleted_at: null,
            unknownProp: "calculated",
          },
          entity1_id: "1",
        },
      ],
    })
  })

  it("should serialize an array of entities", async () => {
    const entity1 = new Entity1WithUnDecoratedProp({
      id: "1",
      deleted_at: null,
    })
    entity1.unknownProp = "calculated"

    const entity2 = new Entity2WithUnDecoratedProp({
      id: "2",
      deleted_at: null,
      entity1: entity1,
    })
    entity1.entity2.add(entity2)

    const serialized = mikroOrmSerializer([entity1, entity1], {
      preventCircularRef: false,
    })

    const expectation = {
      id: "1",
      deleted_at: null,
      unknownProp: "calculated",
      entity2: [
        {
          id: "2",
          deleted_at: null,
          entity1: {
            id: "1",
            deleted_at: null,
            unknownProp: "calculated",
          },
          entity1_id: "1",
        },
      ],
    }

    expect(serialized).toEqual([expectation, expectation])
  })

  it("should serialize an entity preventing circular relation reference", async () => {
    const entity1 = new Entity1WithUnDecoratedProp({
      id: "1",
      deleted_at: null,
    })
    entity1.unknownProp = "calculated"

    const entity2 = new Entity2WithUnDecoratedProp({
      id: "2",
      deleted_at: null,
      entity1: entity1,
    })
    entity1.entity2.add(entity2)

    const serialized = mikroOrmSerializer(entity1)

    expect(serialized).toEqual({
      id: "1",
      deleted_at: null,
      unknownProp: "calculated",
      entity2: [
        {
          id: "2",
          deleted_at: null,
          entity1_id: "1",
        },
      ],
    })
  })

  it(`should properly serialize nested relations and sibling to not return parents into children`, async () => {
    const productOptionValue = new ProductOptionValue()
    productOptionValue.id = "1"
    productOptionValue.name = "Product option value 1"
    productOptionValue.option_id = "1"

    const productOptions = new ProductOption()
    productOptions.id = "1"
    productOptions.name = "Product option 1"
    productOptions.values.add(productOptionValue)

    const productVariant = new ProductVariant()
    productVariant.id = "1"
    productVariant.name = "Product variant 1"
    productVariant.options.add(productOptionValue)

    const product = new Product()
    product.id = "1"
    product.name = "Product 1"
    product.options.add(productOptions)
    product.variants.add(productVariant)

    const serialized = mikroOrmSerializer(product)

    expect(serialized).toEqual({
      id: "1",
      options: [
        {
          id: "1",
          values: [
            {
              id: "1",
              variants: [
                {
                  id: "1",
                  name: "Product variant 1",
                },
              ],
              name: "Product option value 1",
              option_id: "1",
            },
          ],
          name: "Product option 1",
        },
      ],
      variants: [
        {
          id: "1",
          options: [
            {
              id: "1",
              name: "Product option value 1",
              option_id: "1",
              option: {
                id: "1",
                name: "Product option 1",
              },
            },
          ],
          name: "Product variant 1",
        },
      ],
      name: "Product 1",
    })
  })

  it.skip("should compare the original and new serializer performance", async () => {
    const logs: string[] = []
    logs.push(
      "🔬 Comparing serializer performance across different dataset sizes..."
    )

    // Generate test dataset
    function generateComparisonProducts(count: number): Product[] {
      const products: Product[] = []

      for (let i = 0; i < count; i++) {
        const product = new Product()
        product.id = `product-${i}`
        product.name = `Product ${i}`

        // Generate 3 options per product
        for (let optionIndex = 0; optionIndex < 3; optionIndex++) {
          const option = new ProductOption()
          option.id = `option-${product.id}-${optionIndex}`
          option.name = `Option ${optionIndex} for Product ${product.id}`
          option.product = product

          // Generate 3 values per option
          for (let valueIndex = 0; valueIndex < 3; valueIndex++) {
            const value = new ProductOptionValue()
            value.id = `option-value-${option.id}-${valueIndex}`
            value.name = `Option Value ${valueIndex} for Option ${option.id}`
            value.option_id = option.id
            value.option = option
            option.values.add(value)
          }

          product.options.add(option)
        }

        // Generate 2 variants per product
        for (let variantIndex = 0; variantIndex < 2; variantIndex++) {
          const variant = new ProductVariant()
          variant.id = `variant-${product.id}-${variantIndex}`
          variant.name = `Variant ${variantIndex} for Product ${product.id}`
          variant.product_id = product.id
          variant.product = product

          // Assign option values to variants
          const optionArray = product.options.getItems()
          for (let j = 0; j < 2 && j < optionArray.length; j++) {
            const option = optionArray[j]
            const optionValues = option.values.getItems()
            if (optionValues.length > 0) {
              const value = optionValues[0]
              variant.options.add(value)
              value.variants.add(variant)
            }
          }

          product.variants.add(variant)
        }

        products.push(product)
      }

      return products
    }

    // Test configurations
    const testConfigs = [
      {
        name: "Original",
        serializer: mikroOrmSerializerOld,
      },
      {
        name: "New-optimized",
        serializer: mikroOrmSerializer,
      },
      {
        name: "MikroOrm",
        serializer: (products: Product[]) =>
          products.map((product) =>
            EntitySerializer.serialize(product, {
              populate: ["*"],
              forceObject: true,
              skipNull: undefined,
              ignoreSerializers: undefined,
              exclude: undefined,
            })
          ),
      },
    ]

    // Test different dataset sizes
    const testSizes = [10, 100, 1000, 10000]

    logs.push("📊 Each dataset contains products with:")
    logs.push("   - 3 options per product")
    logs.push("   - 9 option values total (3 per option)")
    logs.push("   - 2 variants per product")
    logs.push("   - Complex nested relationships")

    const allResults: Array<{
      size: number
      results: Array<{ name: string; time: number; speedup: number }>
    }> = []

    for (const size of testSizes) {
      logs.push(`\n${"=".repeat(80)}`)
      logs.push(`🎯 TESTING ${size.toLocaleString()} PRODUCTS`)
      logs.push(`${"=".repeat(80)}`)

      const testProducts = generateComparisonProducts(size)
      const sizeResults: Array<{
        name: string
        time: number
        speedup: number
      }> = []

      for (const config of testConfigs) {
        logs.push(`\n📋 Testing: ${config.name}`)
        logs.push("-".repeat(50))

        // Run test multiple times for accuracy
        const times: number[] = []
        const runs = 5

        for (let run = 0; run < runs; run++) {
          const start = performance.now()
          const result = await config.serializer(testProducts)
          const time = performance.now() - start
          times.push(time)

          // Verify result is correct
          expect(result).toHaveLength(size)

          // Only validate structure on first run to save time
          if (run === 0) {
            const firstResult = result[0]
            expect(firstResult).toEqual(
              expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                options: expect.any(Array),
                variants: expect.any(Array),
              })
            )

            // Validate options array structure (should have 3 options)
            expect(firstResult.options).toHaveLength(3)
            expect(firstResult.options[0]).toEqual(
              expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                values: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(String),
                    name: expect.any(String),
                    option_id: expect.any(String),
                    variants: expect.any(Array),
                  }),
                ]),
              })
            )

            // Validate each option has 3 values
            firstResult.options.forEach((option: any) => {
              expect(option.values).toHaveLength(3)
              option.values.forEach((value: any) => {
                expect(value).toEqual(
                  expect.objectContaining({
                    id: expect.any(String),
                    name: expect.any(String),
                    option_id: expect.any(String),
                    variants: expect.any(Array),
                  })
                )
              })
            })

            // Validate variants array structure (should have 2 variants)
            expect(firstResult.variants).toHaveLength(2)
            expect(firstResult.variants[0]).toEqual(
              expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                options: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(String),
                    name: expect.any(String),
                    option_id: expect.any(String),
                    option: expect.objectContaining({
                      id: expect.any(String),
                      name: expect.any(String),
                    }),
                  }),
                ]),
              })
            )

            // Validate each variant has exactly 2 option values assigned
            firstResult.variants.forEach((variant: any) => {
              expect(variant.options).toHaveLength(2)
              variant.options.forEach((optionValue: any) => {
                expect(optionValue).toEqual(
                  expect.objectContaining({
                    id: expect.any(String),
                    name: expect.any(String),
                    option_id: expect.any(String),
                    option: expect.objectContaining({
                      id: expect.any(String),
                      name: expect.any(String),
                    }),
                  })
                )
              })
            })
          }
        }

        const avgTime =
          times.reduce((sum, time) => sum + time, 0) / times.length
        const minTime = Math.min(...times)
        const maxTime = Math.max(...times)

        logs.push(`   Average: ${avgTime.toFixed(2)}ms`)
        logs.push(`   Range: ${minTime.toFixed(2)}ms - ${maxTime.toFixed(2)}ms`)
        logs.push(
          `   Throughput: ${(size / (avgTime / 1000)).toFixed(0)} products/sec`
        )

        sizeResults.push({
          name: config.name,
          time: avgTime,
          speedup: 0, // Will calculate after all tests for this size
        })
      }

      // Calculate speedups relative to original for this size
      const baselineTime = sizeResults[0].time
      sizeResults.forEach((result) => {
        result.speedup = baselineTime / result.time
      })

      logs.push(
        `\n🎯 Performance Summary for ${size.toLocaleString()} products:`
      )
      logs.push("-".repeat(80))
      logs.push(
        `${"Configuration".padEnd(30)} ${"Time".padEnd(12)} ${"Speedup".padEnd(
          12
        )} ${"Throughput"}`
      )
      logs.push("-".repeat(80))

      sizeResults.forEach((result) => {
        const speedupText =
          result.speedup === 1
            ? "baseline"
            : `${result.speedup.toFixed(1)}x faster`
        const throughput = `${(size / (result.time / 1000)).toFixed(
          0
        )} products/sec`
        logs.push(
          `${result.name.padEnd(30)} ${result.time
            .toFixed(2)
            .padStart(8)}ms    ${speedupText.padEnd(12)} ${throughput}`
        )
      })

      allResults.push({ size, results: sizeResults })
    }

    logs.push(`\n\n${"=".repeat(100)}`)
    logs.push("📊 COMPREHENSIVE PERFORMANCE ANALYSIS")
    logs.push(`${"=".repeat(100)}`)

    // Performance scaling analysis
    logs.push("\n📈 Performance Scaling Analysis:")
    logs.push("-".repeat(170))
    logs.push(
      `${"Size".padEnd(12)} ${"MikroOrm (ms)".padEnd(
        15
      )} ${"Original (ms)".padEnd(15)} ${"Optimized (ms)".padEnd(
        16
      )} ${"Speedup from MikroOrm".padEnd(20)} ${"Speedup from Original".padEnd(
        20
      )} ${"Time Saved from MikroOrm".padEnd(23)} ${"Time Saved from Original"}`
    )
    logs.push("-".repeat(170))

    allResults.forEach(({ size, results }) => {
      const mikroOrm = results.find((r) => r.name === "MikroOrm")
      const original = results.find((r) => r.name === "Original")
      const optimized = results.find((r) => r.name === "New-optimized")
      if (original && optimized && mikroOrm) {
        const improvementFromOriginal =
          ((original.time - optimized.time) / original.time) * 100
        const improvementFromMikroOrm =
          ((mikroOrm.time - optimized.time) / mikroOrm.time) * 100
        const speedupFromOriginal = original.time / optimized.time
        const speedupFromMikroOrm = mikroOrm.time / optimized.time
        logs.push(
          `${size.toLocaleString().padEnd(12)} ${mikroOrm.time
            .toFixed(2)
            .padEnd(15)} ${original.time.toFixed(2).padEnd(15)} ${optimized.time
            .toFixed(2)
            .padEnd(16)} ${(speedupFromMikroOrm.toFixed(1) + "x").padEnd(
            20
          )} ${(speedupFromOriginal.toFixed(1) + "x").padEnd(20)} ${(
            improvementFromMikroOrm.toFixed(1) + "%"
          ).padEnd(23)} ${improvementFromOriginal.toFixed(1)}%`
        )
      }
    })

    console.log(logs.join("\n"))
  }, 6000000)
})
