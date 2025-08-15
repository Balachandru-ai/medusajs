import CustomerModule from "@medusajs/customer"
import ProductModule from "@medusajs/product"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { defaultCurrencies, defineLink } from "@medusajs/utils"
import { setTimeout } from "timers/promises"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(120000)

// NOTE: In this tests, both API are used to query, we use object pattern and string pattern

async function populateData(api: any) {
  const shippingProfile = (
    await api.post(
      `/admin/shipping-profiles`,
      { name: "Test", type: "default" },
      adminHeaders
    )
  ).data.shipping_profile

  const payload = [
    {
      title: "Test Product",
      status: "published",
      description: "test-product-description",
      origin_country: "USA",
      shipping_profile_id: shippingProfile.id,
      options: [{ title: "Denominations", values: ["100"] }],
      material: "test-material",
      variants: [
        {
          title: `Test variant 1`,
          sku: `test-variant-1`,
          prices: [
            {
              currency_code: Object.values(defaultCurrencies)[0].code,
              amount: 30,
            },
            {
              currency_code: Object.values(defaultCurrencies)[2].code,
              amount: 50,
            },
          ],
          options: {
            Denominations: "100",
          },
        },
      ],
    },
    {
      title: "Extra product",
      description: "extra description",
      status: "published",
      shipping_profile_id: shippingProfile.id,
      options: [{ title: "Colors", values: ["Red"] }],
      material: "extra-material",
      variants: new Array(2).fill(0).map((_, i) => ({
        title: `extra variant ${i}`,
        sku: `extra-variant-${i}`,
        prices: [
          {
            currency_code: Object.values(defaultCurrencies)[1].code,
            amount: 20,
          },
          {
            currency_code: Object.values(defaultCurrencies)[0].code,
            amount: 80,
          },
        ],
        options: {
          Colors: "Red",
        },
      })),
    },
  ]

  const response = await api.post(
    "/admin/products/batch",
    { create: payload },
    adminHeaders
  )
  const products = response.data.created

  await setTimeout(4000)

  return products
}

process.env.ENABLE_INDEX_MODULE = "true"

medusaIntegrationTestRunner({
  hooks: {
    beforeServerStart: async () => {
      const customer = CustomerModule.linkable.customer
      const product = ProductModule.linkable.product

      defineLink(customer, {
        linkable: product,
        filterable: ["origin_country"],
      })
    },
  },
  testSuite: ({ getContainer, dbConnection, api, dbConfig }) => {
    let appContainer

    beforeAll(() => {
      appContainer = getContainer()
    })

    afterAll(() => {
      process.env.ENABLE_INDEX_MODULE = "false"
    })

    describe("auto-generated CRUD methods", () => {
      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("should create brands", async () => {
        const brandModule = appContainer.resolve("brand")

        const brand = await brandModule.createBrands({
          name: "Medusa Brand",
        })

        expect(brand).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: "Medusa Brand",
          })
        )

        const multipleBrands = await brandModule.createBrands([
          {
            name: "Medusa Brand 2",
          },
          {
            name: "Medusa Brand 3",
          },
        ])

        expect(multipleBrands).toEqual([
          expect.objectContaining({
            id: expect.stringMatching("brand_"),
            name: "Medusa Brand 2",
          }),
          expect.objectContaining({
            id: expect.stringMatching("brand_"),
            name: "Medusa Brand 3",
          }),
        ])
      })

      it("should update brands", async () => {
        const brandModule = appContainer.resolve("brand")

        const multipleBrands = await brandModule.createBrands([
          {
            name: "Medusa Brand 2",
          },
          {
            name: "Medusa Brand 3",
          },
        ])

        const brand = await brandModule.updateBrands({
          id: multipleBrands[0].id,
          name: "Medusa Brand",
        })

        expect(brand).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: "Medusa Brand",
          })
        )

        const multipleBrandsUpdated = await brandModule.updateBrands([
          {
            id: multipleBrands[0].id,
            name: "Medusa Brand 2",
          },
          {
            id: multipleBrands[1].id,
            name: "Medusa Brand 3",
          },
        ])

        expect(multipleBrandsUpdated).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: "Medusa Brand 2",
            }),
            expect.objectContaining({
              id: expect.any(String),
              name: "Medusa Brand 3",
            }),
          ])
        )

        const multipleBrandsUpdatedWithSelector =
          await brandModule.updateBrands({
            selector: {
              name: { $like: "Medusa Brand 2" },
            },
            data: {
              name: "Medusa Brand **",
            },
          })

        expect(multipleBrandsUpdatedWithSelector).toEqual([
          expect.objectContaining({
            id: expect.any(String),
            name: "Medusa Brand **",
          }),
        ])
      })
    })
  },
})
