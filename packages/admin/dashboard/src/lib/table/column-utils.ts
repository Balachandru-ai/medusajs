import { HttpTypes } from "@medusajs/types"

/**
 * Determines column header and cell alignment based on column metadata.
 * Uses semantic information (data_type, semantic_type, render_mode) rather than
 * entity-specific rules.
 */
export function getColumnAlignment(
  column: HttpTypes.AdminColumn
): "left" | "center" | "right" {
  // Right align: numeric data (easier to compare/sum visually)
  if (
    column.data_type === "currency" ||
    column.data_type === "number" ||
    column.semantic_type === "currency" ||
    column.semantic_type === "quantity" ||
    column.semantic_type === "amount" ||
    column.render_mode === "currency" ||
    column.render_mode === "number" ||
    column.render_mode === "total"
  ) {
    return "right"
  }

  // Center align: visual indicators that work better centered
  if (
    column.semantic_type === "status" ||
    column.semantic_type === "indicator" ||
    column.render_mode === "status" ||
    column.render_mode === "country_code" ||
    column.render_mode === "boolean" ||
    column.render_mode === "badge" ||
    column.render_mode === "image" ||
    column.data_type === "boolean"
  ) {
    return "center"
  }

  // Default: left align (text, dates, IDs, etc.)
  return "left"
}
