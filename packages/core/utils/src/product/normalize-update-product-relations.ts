import { UpdateProductDTO } from "@medusajs/types"

/**
 * Normalizes product update input by converting ID arrays to relation objects
 * Although this is handled by product service when updating, we need this when 
 * when updating through a selector, as otherwise we query by inexistent relations.
 *
 * Transforms:
 * - `category_ids` → `categories: [{ id }]`
 * - `tag_ids` → `tags: [{ id }]`
 * - `collection_id` → `collection: { id }`
 *
 * @param input - The product update input data to normalize relations for
 * @returns Normalized product input with relation objects
 *
 * @example
 * ```typescript
 * const input = {
 *   title: "My Product",
 *   category_ids: ["cat_123", "cat_456"],
 *   tag_ids: ["tag_789"]
 * }
 *
 * const normalized = normalizeUpdateProductRelations(input)
 * // Result:
 * // {
 * //   title: "My Product",
 * //   categories: [{ id: "cat_123" }, { id: "cat_456" }],
 * //   tags: [{ id: "tag_789" }]
 * // }
 * ```
 */
export function normalizeUpdateProductRelations(
  input: UpdateProductDTO
) {
  const normalized = { ...input }

  if ("tag_ids" in normalized && normalized.tag_ids) {
    ;(normalized as any).tags = normalized.tag_ids.map((id: string) => ({
      id,
    }))
    delete normalized.tag_ids
  }

  if ("category_ids" in normalized && normalized.category_ids) {
    ;(normalized as any).categories = normalized.category_ids.map(
      (id: string) => ({ id })
    )
    delete normalized.category_ids
  }

  if ("collection_id" in normalized && normalized.collection_id) {
    ;(normalized as any).collection = { id: normalized.collection_id }
    delete normalized.collection_id
  }

  return normalized
}
