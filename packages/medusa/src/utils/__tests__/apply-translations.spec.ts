import { MedusaRequest } from "@medusajs/framework/http"
import { FeatureFlag } from "@medusajs/framework/utils"
import { applyTranslations } from "../apply-translations"

jest.mock("@medusajs/framework/utils", () => ({
  ...jest.requireActual("@medusajs/framework/utils"),
  FeatureFlag: {
    isFeatureEnabled: jest.fn(),
  },
}))

const mockFeatureFlagIsEnabled = FeatureFlag.isFeatureEnabled as jest.Mock

describe("applyTranslations", () => {
  let mockQuery: { graph: jest.Mock }
  let mockContainer: { resolve: jest.Mock }
  let mockReq: Partial<MedusaRequest>

  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery = {
      graph: jest.fn().mockResolvedValue({ data: [] }),
    }
    mockContainer = {
      resolve: jest.fn().mockReturnValue(mockQuery),
    }
    mockReq = {
      locale: "en-US",
    }
  })

  beforeEach(() => {
    mockFeatureFlagIsEnabled.mockReturnValue(true)
  })

  it("should apply translations to a simple object", async () => {
    const inputObjects = [{ id: "prod_1", title: "Original Title" }]

    mockQuery.graph.mockResolvedValue({
      data: [
        {
          entity_id: "prod_1",
          translations: { title: "Translated Title" },
        },
      ],
    })

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(inputObjects[0].title).toBe("Translated Title")
  })

  it("should apply translations to nested objects", async () => {
    const inputObjects = [
      {
        id: "prod_1",
        title: "Product Title",
        category: {
          id: "cat_1",
          name: "Category Name",
        },
      },
    ]

    mockQuery.graph.mockResolvedValue({
      data: [
        {
          entity_id: "prod_1",
          translations: { title: "Translated Product Title", category: true },
        },
        {
          entity_id: "cat_1",
          translations: { name: "Translated Category Name" },
        },
      ],
    })

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(inputObjects[0].title).toBe("Translated Product Title")
    expect(inputObjects[0].category.name).toBe("Translated Category Name")
  })

  it("should apply translations to arrays of objects", async () => {
    const inputObjects = [
      {
        id: "prod_1",
        title: "Product Title",
        variants: [
          { id: "var_1", name: "Variant 1" },
          { id: "var_2", name: "Variant 2" },
        ],
      },
    ]

    mockQuery.graph.mockResolvedValue({
      data: [
        {
          entity_id: "prod_1",
          translations: { title: "Translated Product" },
        },
        {
          entity_id: "var_1",
          translations: { name: "Translated Variant 1" },
        },
        {
          entity_id: "var_2",
          translations: { name: "Translated Variant 2" },
        },
      ],
    })

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(inputObjects[0].title).toBe("Translated Product")
    expect(inputObjects[0].variants[0].name).toBe("Translated Variant 1")
    expect(inputObjects[0].variants[1].name).toBe("Translated Variant 2")
  })

  it("should use the locale from the request", async () => {
    mockReq.locale = "fr-FR"
    const inputObjects = [{ id: "prod_1", title: "Original" }]

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(mockQuery.graph).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          locale_code: "fr-FR",
        }),
      })
    )
  })

  it("should default to en-US locale when not specified", async () => {
    mockReq = {}
    const inputObjects = [{ id: "prod_1", title: "Original" }]

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(mockQuery.graph).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          locale_code: "en-US",
        }),
      })
    )
  })

  it("should batch queries when there are more than 250 ids", async () => {
    const inputObjects = Array.from({ length: 300 }, (_, i) => ({
      id: `prod_${i}`,
      title: `Product ${i}`,
    }))

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(mockQuery.graph).toHaveBeenCalledTimes(2)
  })

  it("should apply translations to multiple input objects", async () => {
    const inputObjects = [
      { id: "prod_1", title: "Product 1" },
      { id: "prod_2", title: "Product 2" },
    ]

    mockQuery.graph.mockResolvedValue({
      data: [
        { entity_id: "prod_1", translations: { title: "Translated 1" } },
        { entity_id: "prod_2", translations: { title: "Translated 2" } },
      ],
    })

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(inputObjects[0].title).toBe("Translated 1")
    expect(inputObjects[1].title).toBe("Translated 2")
  })

  it("should handle translations with null values", async () => {
    const inputObjects = [{ id: "prod_1", title: "Original" }]

    mockQuery.graph.mockResolvedValue({
      data: [
        {
          entity_id: "prod_1",
          translations: null,
        },
      ],
    })

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(inputObjects[0].title).toBe("Original")
  })

  it("should return early when feature flag is disabled", async () => {
    mockFeatureFlagIsEnabled.mockReturnValue(false)
    const inputObjects = [{ id: "prod_1", title: "Original" }]

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(mockContainer.resolve).not.toHaveBeenCalled()
    expect(inputObjects[0].title).toBe("Original")
  })

  it("should not modify objects when no translations are found", async () => {
    mockFeatureFlagIsEnabled.mockReturnValue(true)
    const inputObjects = [{ id: "prod_1", title: "Original Title" }]

    mockQuery.graph.mockResolvedValue({ data: [] })

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(inputObjects[0].title).toBe("Original Title")
  })

  it("should handle empty input array without errors", async () => {
    mockFeatureFlagIsEnabled.mockReturnValue(true)
    const inputObjects: Record<string, any>[] = []

    await expect(
      applyTranslations({
        req: mockReq as MedusaRequest,
        inputObjects,
        container: mockContainer as any,
      })
    ).resolves.not.toThrow()
  })

  it("should not modify properties that do not exist in the object", async () => {
    mockFeatureFlagIsEnabled.mockReturnValue(true)
    const inputObjects = [{ id: "prod_1", title: "Original" }]

    mockQuery.graph.mockResolvedValue({
      data: [
        {
          entity_id: "prod_1",
          translations: { description: "Translated Description" },
        },
      ],
    })

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(inputObjects[0].title).toBe("Original")
    expect(inputObjects[0]).not.toHaveProperty("description")
  })

  it("should handle objects with undefined id gracefully", async () => {
    mockFeatureFlagIsEnabled.mockReturnValue(true)
    const inputObjects = [{ id: undefined, title: "Original" }]

    mockQuery.graph.mockResolvedValue({ data: [] })

    await expect(
      applyTranslations({
        req: mockReq as MedusaRequest,
        inputObjects: inputObjects as any,
        container: mockContainer as any,
      })
    ).resolves.not.toThrow()
  })

  it("should only apply translations to matching keys", async () => {
    mockFeatureFlagIsEnabled.mockReturnValue(true)
    const inputObjects = [
      { id: "prod_1", title: "Original Title", handle: "original-handle" },
    ]

    mockQuery.graph.mockResolvedValue({
      data: [
        {
          entity_id: "prod_1",
          translations: { title: "Translated Title" },
        },
      ],
    })

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(inputObjects[0].title).toBe("Translated Title")
    expect(inputObjects[0].handle).toBe("original-handle")
  })

  it("should handle deeply nested structures", async () => {
    mockFeatureFlagIsEnabled.mockReturnValue(true)
    const inputObjects = [
      {
        id: "prod_1",
        title: "Product",
        category: {
          id: "cat_1",
          name: "Category",
          parent: {
            id: "cat_parent",
            name: "Parent Category",
          },
        },
      },
    ]

    mockQuery.graph.mockResolvedValue({
      data: [
        {
          entity_id: "prod_1",
          translations: { title: "Translated Product" },
        },
        {
          entity_id: "cat_1",
          translations: { name: "Translated Category" },
        },
        {
          entity_id: "cat_parent",
          translations: { name: "Translated Parent" },
        },
      ],
    })

    await applyTranslations({
      req: mockReq as MedusaRequest,
      inputObjects,
      container: mockContainer as any,
    })

    expect(inputObjects[0].title).toBe("Translated Product")
    expect(inputObjects[0].category.name).toBe("Translated Category")
    expect(inputObjects[0].category.parent.name).toBe("Translated Parent")
  })
})
