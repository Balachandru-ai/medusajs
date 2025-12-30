import { ComponentType } from "react"

type WidgetWithRank = {
  Component: ComponentType
  rank?: number
}

/**
 * Sort widgets by rank in ascending order.
 * Widgets with rank come first, sorted by rank value.
 * Widgets without rank come last, maintaining their original order.
 */
export function sortWidgetsByRank(widgets: WidgetWithRank[]): WidgetWithRank[] {
  return widgets.sort((a, b) => {
    // If both have rank, sort by rank value
    if (a.rank !== undefined && b.rank !== undefined) {
      return a.rank - b.rank
    }
    // If only a has rank, it comes first
    if (a.rank !== undefined) {
      return -1
    }
    // If only b has rank, it comes first
    if (b.rank !== undefined) {
      return 1
    }
    // If neither has rank, maintain original order
    return 0
  })
}
