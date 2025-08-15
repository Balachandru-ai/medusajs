import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(100000)

process.env.ENABLE_INDEX_MODULE = "true"

medusaIntegrationTestRunner({
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
