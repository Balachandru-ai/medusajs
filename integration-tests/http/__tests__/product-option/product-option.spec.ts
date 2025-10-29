import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(30000)

medusaIntegrationTestRunner({
  env: {},
  testSuite: ({ dbConnection, getContainer, api }) => {
    let option1
    let option2

    beforeEach(async () => {
      const container = getContainer()
      await createAdminUser(dbConnection, adminHeaders, container)

      option1 = (
        await api.post(
          "/admin/product-options",
          {
            title: "option1",
            values: ["A", "B", "C"],
          },
          adminHeaders
        )
      ).data.product_option

      option2 = (
        await api.post(
          "/admin/product-options",
          {
            title: "option2",
            values: ["D", "E"],
            is_exclusive: true,
          },
          adminHeaders
        )
      ).data.product_option
    })

    describe("GET /admin/product-options", () => {
      it("returns a list of product options", async () => {
        const res = await api.get("/admin/product-options", adminHeaders)

        expect(res.status).toEqual(200)
        expect(res.data.product_options).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              title: "option1",
              is_exclusive: false,
              values: expect.arrayContaining([
                expect.objectContaining({ value: "A" }),
                expect.objectContaining({ value: "B" }),
                expect.objectContaining({ value: "C" }),
              ]),
            }),
            expect.objectContaining({
              title: "option2",
              is_exclusive: true,
              values: expect.arrayContaining([
                expect.objectContaining({ value: "D" }),
                expect.objectContaining({ value: "E" }),
              ]),
            }),
          ])
        )
      })

      it("returns a list of product options matching free text search param", async () => {
        const res = await api.get("/admin/product-options?q=1", adminHeaders)

        expect(res.status).toEqual(200)
        expect(res.data.product_options.length).toEqual(1)
        expect(res.data.product_options).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ title: "option1" }),
          ])
        )
      })

      it("returns a list of exclusive product options", async () => {
        const res = await api.get(
          "/admin/product-options?is_exclusive=false",
          adminHeaders
        )

        expect(res.status).toEqual(200)
        expect(res.data.product_options.length).toEqual(1)
        expect(res.data.product_options).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ title: "option1" }),
          ])
        )
      })
    })

    describe("POST /admin/product-options", () => {
      it("creates a product option with value ranks", async () => {
        const option = (
          await api.post(
            `/admin/product-options`,
            {
              title: "option3",
              values: ["D", "E"],
              ranks: {
                E: 1,
                D: 2,
              },
            },
            adminHeaders
          )
        ).data.product_option

        expect(option).toEqual(
          expect.objectContaining({
            title: "option3",
            is_exclusive: false,
            values: expect.arrayContaining([
              expect.objectContaining({
                value: "D",
                rank: 2,
              }),
              expect.objectContaining({
                value: "E",
                rank: 1,
              }),
            ]),
          })
        )
      })

      it("throws ir a rank is specified for invalid value", async () => {
        const error = await api
          .post(
            `/admin/product-options`,
            {
              title: "option3",
              values: ["D", "E"],
              ranks: {
                E: 1,
                invalid: 2,
              },
            },
            adminHeaders
          )
          .catch((err) => err)

        expect(error.response.status).toEqual(400)
        expect(error.response.data.message).toEqual(
          'Value "invalid" is assigned a rank but is not defined in the list of values.'
        )
      })
    })

    describe("GET /admin/product-options/[id]", () => {
      it("returns a product option", async () => {
        const res = await api.get(
          `/admin/product-options/${option1.id}`,
          adminHeaders
        )

        expect(res.status).toEqual(200)
        expect(res.data.product_option).toEqual(
          expect.objectContaining({
            title: "option1",
            is_exclusive: false,
            values: expect.arrayContaining([
              expect.objectContaining({ value: "A" }),
              expect.objectContaining({ value: "B" }),
              expect.objectContaining({ value: "C" }),
            ]),
          })
        )
      })
    })

    describe("POST /admin/product-options/[id]", () => {
      it("updates a product option", async () => {
        const option = (
          await api.post(
            `/admin/product-options/${option2.id}`,
            {
              is_exclusive: false,
            },
            adminHeaders
          )
        ).data.product_option

        expect(option).toEqual(
          expect.objectContaining({
            title: "option2",
            is_exclusive: false,
            values: expect.arrayContaining([
              expect.objectContaining({ value: "D" }),
              expect.objectContaining({ value: "E" }),
            ]),
          })
        )

        const res = await api.get(
          "/admin/product-options?is_exclusive=true",
          adminHeaders
        )

        expect(res.status).toEqual(200)
        expect(res.data.product_options.length).toEqual(0)
      })

      it("updates a product value ranks", async () => {
        const option = (
          await api.post(
            `/admin/product-options/${option2.id}`,
            {
              ranks: {
                D: 2,
                E: 1,
              },
            },
            adminHeaders
          )
        ).data.product_option

        expect(option).toEqual(
          expect.objectContaining({
            title: "option2",
            is_exclusive: true,
            values: expect.arrayContaining([
              expect.objectContaining({
                value: "D",
                rank: 2,
              }),
              expect.objectContaining({
                value: "E",
                rank: 1,
              }),
            ]),
          })
        )
      })
    })

    describe("DELETE /admin/product-options/[id]", () => {
      it("deletes a product option", async () => {
        await api.delete(`/admin/product-options/${option2.id}`, adminHeaders)

        const res = await api.get("/admin/product-options", adminHeaders)

        expect(res.status).toEqual(200)
        expect(res.data.product_options.length).toEqual(1)
      })
    })
  },
})
