import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  adminHeaders,
  createAdminUser,
} from "../../../../helpers/create-admin-user"

jest.setTimeout(100000)

process.env.MEDUSA_FF_TRANSLATION = "true"

medusaIntegrationTestRunner({
  testSuite: ({ dbConnection, getContainer, api }) => {
    describe("Admin Translation Settings Batch API", () => {
      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, getContainer())
      })

      afterAll(async () => {
        delete process.env.MEDUSA_FF_TRANSLATION
      })

      describe("POST /admin/translations/settings/batch", () => {
        describe("create", () => {
          it("should create a single translation setting", async () => {
            const response = await api.post(
              "/admin/translations/settings/batch",
              {
                create: [
                  {
                    entity_type: "product_variant",
                    fields: ["title", "material"],
                    is_active: true,
                  },
                ],
              },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.created).toHaveLength(1)
            expect(response.data.created[0]).toEqual(
              expect.objectContaining({
                id: expect.any(String),
                entity_type: "product_variant",
                fields: ["title", "material"],
                is_active: true,
                created_at: expect.any(String),
                updated_at: expect.any(String),
              })
            )
          })

          it("should create multiple translation settings", async () => {
            const response = await api.post(
              "/admin/translations/settings/batch",
              {
                create: [
                  {
                    entity_type: "product_variant",
                    fields: ["title", "material"],
                    is_active: true,
                  },
                  {
                    entity_type: "product_category",
                    fields: ["name", "description"],
                    is_active: true,
                  },
                  {
                    entity_type: "product_collection",
                    fields: ["title"],
                    is_active: false,
                  },
                ],
              },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.created).toHaveLength(3)
            expect(response.data.created).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  entity_type: "product_variant",
                  fields: ["title", "material"],
                  is_active: true,
                }),
                expect.objectContaining({
                  entity_type: "product_category",
                  fields: ["name", "description"],
                  is_active: true,
                }),
                expect.objectContaining({
                  entity_type: "product_collection",
                  fields: ["title"],
                  is_active: false,
                }),
              ])
            )
          })
        })

        describe("update", () => {
          it("should update an existing translation setting", async () => {
            const createResponse = await api.post(
              "/admin/translations/settings/batch",
              {
                create: [
                  {
                    entity_type: "product_variant",
                    fields: ["title"],
                    is_active: true,
                  },
                ],
              },
              adminHeaders
            )

            const settingId = createResponse.data.created[0].id

            const updateResponse = await api.post(
              "/admin/translations/settings/batch",
              {
                update: [
                  {
                    id: settingId,
                    entity_type: "product_variant",
                    fields: ["title", "material"],
                  },
                ],
              },
              adminHeaders
            )

            expect(updateResponse.status).toEqual(200)
            expect(updateResponse.data.updated).toHaveLength(1)
            expect(updateResponse.data.updated[0]).toEqual(
              expect.objectContaining({
                id: settingId,
                entity_type: "product_variant",
                fields: ["title", "material"],
                is_active: true,
              })
            )
          })

          it("should update multiple translation settings", async () => {
            const createResponse = await api.post(
              "/admin/translations/settings/batch",
              {
                create: [
                  {
                    entity_type: "product_variant",
                    fields: ["title"],
                    is_active: true,
                  },
                  {
                    entity_type: "product_category",
                    fields: ["name"],
                    is_active: true,
                  },
                ],
              },
              adminHeaders
            )

            const [settingId1, settingId2] = createResponse.data.created.map(
              (s) => s.id
            )

            const updateResponse = await api.post(
              "/admin/translations/settings/batch",
              {
                update: [
                  {
                    id: settingId1,
                    entity_type: "product_variant",
                    fields: ["title", "material"],
                  },
                  {
                    id: settingId2,
                    entity_type: "product_category",
                    is_active: false,
                  },
                ],
              },
              adminHeaders
            )

            expect(updateResponse.status).toEqual(200)
            expect(updateResponse.data.updated).toHaveLength(2)
            expect(updateResponse.data.updated).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  entity_type: "product_variant",
                  fields: ["title", "material"],
                }),
                expect.objectContaining({
                  entity_type: "product_category",
                  is_active: false,
                }),
              ])
            )
          })
        })

        describe("delete", () => {
          it("should delete a translation setting", async () => {
            const createResponse = await api.post(
              "/admin/translations/settings/batch",
              {
                create: [
                  {
                    entity_type: "product_variant",
                    fields: ["title"],
                    is_active: true,
                  },
                ],
              },
              adminHeaders
            )

            const settingId = createResponse.data.created[0].id

            const deleteResponse = await api.post(
              "/admin/translations/settings/batch",
              {
                delete: [settingId],
              },
              adminHeaders
            )

            expect(deleteResponse.status).toEqual(200)
            expect(deleteResponse.data.deleted).toEqual({
              ids: [settingId],
              object: "translation_settings",
              deleted: true,
            })
          })

          it("should delete multiple translation settings", async () => {
            const createResponse = await api.post(
              "/admin/translations/settings/batch",
              {
                create: [
                  {
                    entity_type: "product_variant",
                    fields: ["title"],
                    is_active: true,
                  },
                  {
                    entity_type: "product_category",
                    fields: ["name"],
                    is_active: true,
                  },
                  {
                    entity_type: "product_collection",
                    fields: ["title"],
                    is_active: true,
                  },
                ],
              },
              adminHeaders
            )

            const ids = createResponse.data.created.map((s) => s.id)

            const deleteResponse = await api.post(
              "/admin/translations/settings/batch",
              {
                delete: ids,
              },
              adminHeaders
            )

            expect(deleteResponse.status).toEqual(200)
            expect(deleteResponse.data.deleted).toEqual({
              ids: expect.arrayContaining(ids),
              object: "translation_settings",
              deleted: true,
            })
            expect(deleteResponse.data.deleted.ids).toHaveLength(3)
          })

          it("should handle deleting with empty array", async () => {
            const response = await api.post(
              "/admin/translations/settings/batch",
              {
                delete: [],
              },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.deleted).toEqual({
              ids: [],
              object: "translation_settings",
              deleted: true,
            })
          })
        })

        describe("combined operations", () => {
          it("should handle create, update, and delete in a single batch", async () => {
            const setupResponse = await api.post(
              "/admin/translations/settings/batch",
              {
                create: [
                  {
                    entity_type: "product_variant",
                    fields: ["title"],
                    is_active: true,
                  },
                  {
                    entity_type: "product_category",
                    fields: ["name"],
                    is_active: true,
                  },
                ],
              },
              adminHeaders
            )

            const [settingId1, settingId2] = setupResponse.data.created.map(
              (s) => s.id
            )

            const batchResponse = await api.post(
              "/admin/translations/settings/batch",
              {
                create: [
                  {
                    entity_type: "product_collection",
                    fields: ["title"],
                    is_active: true,
                  },
                ],
                update: [
                  {
                    id: settingId1,
                    entity_type: "product_variant",
                    fields: ["title", "material"],
                    is_active: false,
                  },
                ],
                delete: [settingId2],
              },
              adminHeaders
            )

            expect(batchResponse.status).toEqual(200)
            expect(batchResponse.data.created).toHaveLength(1)
            expect(batchResponse.data.updated).toHaveLength(1)
            expect(batchResponse.data.deleted.ids).toContain(settingId2)

            expect(batchResponse.data.created[0]).toEqual(
              expect.objectContaining({
                entity_type: "product_collection",
                fields: ["title"],
                is_active: true,
              })
            )

            expect(batchResponse.data.updated[0]).toEqual(
              expect.objectContaining({
                id: settingId1,
                fields: ["title", "material"],
                is_active: false,
              })
            )
          })

          it("should handle empty batch request", async () => {
            const response = await api.post(
              "/admin/translations/settings/batch",
              {
                create: [],
                update: [],
                delete: [],
              },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.created).toEqual([])
            expect(response.data.updated).toEqual([])
            expect(response.data.deleted.ids).toEqual([])
          })
        })

        describe("validation", () => {
          it("should reject non-translatable entity types", async () => {
            const error = await api
              .post(
                "/admin/translations/settings/batch",
                {
                  create: [
                    {
                      entity_type: "NonExistentEntity",
                      fields: ["title"],
                      is_active: true,
                    },
                  ],
                },
                adminHeaders
              )
              .catch((e) => e)

            expect(error.response.status).toEqual(400)
            expect(error.response.data.message).toContain(
              "NonExistentEntity is not a translatable entity"
            )
          })

          it("should reject invalid fields for translatable entities", async () => {
            const error = await api
              .post(
                "/admin/translations/settings/batch",
                {
                  create: [
                    {
                      entity_type: "product_variant",
                      fields: ["title", "invalid_field", "another_invalid"],
                      is_active: true,
                    },
                  ],
                },
                adminHeaders
              )
              .catch((e) => e)

            expect(error.response.status).toEqual(400)
            expect(error.response.data.message).toContain("product_variant")
            expect(error.response.data.message).toContain("invalid_field")
            expect(error.response.data.message).toContain("another_invalid")
          })

          it("should reject multiple invalid settings in a single batch", async () => {
            const error = await api
              .post(
                "/admin/translations/settings/batch",
                {
                  create: [
                    {
                      entity_type: "NonExistentEntity",
                      fields: ["title"],
                      is_active: true,
                    },
                    {
                      entity_type: "product_variant",
                      fields: ["title", "invalid_field"],
                      is_active: true,
                    },
                  ],
                },
                adminHeaders
              )
              .catch((e) => e)

            expect(error.response.status).toEqual(400)
            expect(error.response.data.message).toContain(
              "NonExistentEntity is not a translatable entity"
            )
            expect(error.response.data.message).toContain("product_variant")
            expect(error.response.data.message).toContain("invalid_field")
          })

          it("should accept valid fields for translatable entities", async () => {
            const response = await api.post(
              "/admin/translations/settings/batch",
              {
                create: [
                  {
                    entity_type: "product_variant",
                    fields: ["title", "material"],
                    is_active: true,
                  },
                  {
                    entity_type: "product_category",
                    fields: ["name", "description"],
                    is_active: true,
                  },
                  {
                    entity_type: "product_collection",
                    fields: ["title"],
                    is_active: true,
                  },
                ],
              },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.created).toHaveLength(3)
          })
        })
      })
    })
  },
})
