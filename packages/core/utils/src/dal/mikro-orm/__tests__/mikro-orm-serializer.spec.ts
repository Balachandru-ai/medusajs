import { MikroORM } from "@mikro-orm/core"
import { defineConfig } from "@mikro-orm/postgresql"
import {
  Entity1WithUnDecoratedProp,
  Entity2WithUnDecoratedProp,
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "../__fixtures__/utils"
import { mikroOrmSerializer } from "../mikro-orm-serializer"
import { mikroOrmSerializer as mikroOrmSerializerOld } from "../mikro-orm-serializer-old"
import fs from "fs"
import path from "path"
import { ulid } from "ulid"

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

    const serialized = await mikroOrmSerializer(entity1, {
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

    const serialized = await mikroOrmSerializer([entity1, entity1], {
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

    const serialized = await mikroOrmSerializer(entity1)

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

    const serialized = await mikroOrmSerializer(product)

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

  describe.only("Performance Comparison", () => {
    function createTestProduct(index: number): Product {
      const id = ulid()
      const productOptionValue = new ProductOptionValue()
      productOptionValue.id = `pov-${id}`
      productOptionValue.name = `Product option value ${index}`
      productOptionValue.option_id = `po-${index}`

      const productOption = new ProductOption()
      productOption.id = `po-${id}`
      productOption.name = `Product option ${index}`
      productOption.values.add(productOptionValue)

      const productVariant = new ProductVariant()
      productVariant.id = `pv-${id}`
      productVariant.name = `Product variant ${index}`
      productVariant.options.add(productOptionValue)

      const product = new Product()
      product.id = `p-${id}`
      product.name = `Product ${index}`
      product.options.add(productOption)
      product.variants.add(productVariant)

      return product
    }

    const aggregatedResults: {
      entities: number
      timeOldMs: number
      timeNewMs: number
      speedup: number
    }[] = []

    afterAll(() => {
      // write aggregated results to a file
      fs.writeFileSync(
        path.join(__dirname, "mikro-orm-serializer-performance-results.json"),
        JSON.stringify(aggregatedResults, null, 2)
      )
    })

    it.each([10, 50, 100, 1000, 10000])(
      "should compare performance between old and new serializer with %s entities",
      async (ENTITY_COUNT) => {
        console.log(
          `Creating ${ENTITY_COUNT.toLocaleString()} test entities...`
        )

        const products: Product[] = []
        for (let i = 0; i < ENTITY_COUNT; i++) {
          products.push(createTestProduct(i))
        }
        console.log("Entities created.")

        const results: {
          timeOldMs: number
          timeNewMs: number
          speedup: number
        }[] = []

        for (let i = 0; i < 10; i++) {
          // Test old serializer
          console.log("Testing OLD serializer...")
          const startOld = process.hrtime.bigint()
          const resultOld = await mikroOrmSerializerOld(products)
          const endOld = process.hrtime.bigint()
          const timeOldMs = Number(endOld - startOld) / 1_000_000

          console.log("OLD serializer - Time:", timeOldMs.toFixed(2) + "ms")

          // Clear memory and force GC if available
          if (global.gc) {
            global.gc()
          }

          // Test new serializer
          console.log("Testing NEW serializer...")
          const startNew = process.hrtime.bigint()
          const resultNew = await mikroOrmSerializer(products)
          const endNew = process.hrtime.bigint()
          const timeNewMs = Number(endNew - startNew) / 1_000_000

          console.log("NEW serializer - Time:", timeNewMs.toFixed(2) + "ms")

          // Performance comparison
          const speedup = timeOldMs / timeNewMs

          results.push({
            timeOldMs,
            timeNewMs,
            speedup,
          })

          console.log(
            `\n=== PERFORMANCE RESULTS ===\n\nEntities processed: ${ENTITY_COUNT.toLocaleString()}\nOLD serializer: ${timeOldMs.toFixed(
              2
            )}ms\nNEW serializer: ${timeNewMs.toFixed(2)}ms\nSpeedup: ${(
              (speedup - 1) *
              100
            ).toFixed(2)}% faster`
          )
        }

        // compute average speedup per entity count
        const averageSpeedup =
          results.reduce((acc, curr) => acc + curr.speedup, 0) / results.length

        const averageTimeOldMs =
          results.reduce((acc, curr) => acc + curr.timeOldMs, 0) /
          results.length

        const averageTimeNewMs =
          results.reduce((acc, curr) => acc + curr.timeNewMs, 0) /
          results.length

        aggregatedResults.push({
          entities: ENTITY_COUNT,
          timeOldMs: averageTimeOldMs,
          timeNewMs: averageTimeNewMs,
          speedup: (averageSpeedup - 1) * 100,
        })
      }
    )
  })
})
