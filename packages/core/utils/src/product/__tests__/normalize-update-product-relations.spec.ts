import { normalizeUpdateProductRelations } from "../normalize-update-product-relations"

describe("normalizeUpdateProductRelations", () => {
  it("should transform tag_ids to tags", () => {
    const input = {
      title: "My Product",
      tag_ids: ["tag_123", "tag_456"],
    }

    const result = normalizeUpdateProductRelations(input)

    expect(result).toEqual({
      title: "My Product",
      tags: [{ id: "tag_123" }, { id: "tag_456" }],
    })
  })

  it("should transform category_ids to categories", () => {
    const input = {
      title: "My Product",
      category_ids: ["cat_123", "cat_456"],
    }

    const result = normalizeUpdateProductRelations(input)

    expect(result).toEqual({
      title: "My Product",
      categories: [{ id: "cat_123" }, { id: "cat_456" }],
    })
  })

  it("should transform collection_id to collection", () => {
    const input = {
      title: "My Product",
      collection_id: "col_123",
    }

    const result = normalizeUpdateProductRelations(input) as any

    expect(result).toEqual({
      title: "My Product",
      collection: { id: "col_123" },
    })
  })

  it("should transform all relations combined", () => {
    const input = {
      title: "My Product",
      description: "A great product",
      tag_ids: ["tag_123", "tag_456"],
      category_ids: ["cat_123"],
      collection_id: "col_123",
    }

    const result = normalizeUpdateProductRelations(input) as any

    expect(result).toEqual({
      title: "My Product",
      description: "A great product",
      tags: [{ id: "tag_123" }, { id: "tag_456" }],
      categories: [{ id: "cat_123" }],
      collection: { id: "col_123" },
    })
  })

  it("should handle input with no relations", () => {
    const input = {
      title: "My Product",
      description: "A great product",
    }

    const result = normalizeUpdateProductRelations(input) as any

    expect(result).toEqual({
      title: "My Product",
      description: "A great product",
    })
  })

  it("should preserve other properties while transforming relations", () => {
    const input = {
      id: "prod_123",
      title: "My Product",
      description: "A great product",
      weight: 500,
      tag_ids: ["tag_123"],
      category_ids: ["cat_123"],
      collection_id: "col_123",
    }

    const result = normalizeUpdateProductRelations(input) as any

    expect(result.id).toBe("prod_123")
    expect(result.title).toBe("My Product")
    expect(result.description).toBe("A great product")
    expect(result.weight).toBe(500)
    expect(result.tags).toEqual([{ id: "tag_123" }])
    expect(result.categories).toEqual([{ id: "cat_123" }])
    expect(result.collection).toEqual({ id: "col_123" })
  })
})
