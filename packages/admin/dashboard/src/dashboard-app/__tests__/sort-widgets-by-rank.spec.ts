import { describe, expect, it } from "vitest"
import { sortWidgetsByRank } from "../utils/sort-widgets-by-rank"

const MockComponent1 = () => null
const MockComponent2 = () => null
const MockComponent3 = () => null
const MockComponent4 = () => null

describe("sortWidgetsByRank", () => {
  it("should sort widgets by rank in ascending order", () => {
    const widgets = [
      { Component: MockComponent1, rank: 3 },
      { Component: MockComponent2, rank: 1 },
      { Component: MockComponent3, rank: 2 },
    ]

    const sorted = sortWidgetsByRank(widgets)

    expect(sorted[0].rank).toBe(1)
    expect(sorted[1].rank).toBe(2)
    expect(sorted[2].rank).toBe(3)
  })

  it("should place widgets with rank before widgets without rank", () => {
    const widgets = [
      { Component: MockComponent1 },
      { Component: MockComponent2, rank: 2 },
      { Component: MockComponent3, rank: 1 },
      { Component: MockComponent4 },
    ]

    const sorted = sortWidgetsByRank(widgets)

    expect(sorted[0].rank).toBe(1)
    expect(sorted[1].rank).toBe(2)
    expect(sorted[2].rank).toBeUndefined()
    expect(sorted[3].rank).toBeUndefined()
  })

  it("should handle widgets with rank 0", () => {
    const widgets = [
      { Component: MockComponent1, rank: 2 },
      { Component: MockComponent2, rank: 0 },
      { Component: MockComponent3, rank: 1 },
    ]

    const sorted = sortWidgetsByRank(widgets)

    expect(sorted[0].rank).toBe(0)
    expect(sorted[1].rank).toBe(1)
    expect(sorted[2].rank).toBe(2)
  })

  it("should handle negative ranks", () => {
    const widgets = [
      { Component: MockComponent1, rank: 1 },
      { Component: MockComponent2, rank: -1 },
      { Component: MockComponent3, rank: 0 },
    ]

    const sorted = sortWidgetsByRank(widgets)

    expect(sorted[0].rank).toBe(-1)
    expect(sorted[1].rank).toBe(0)
    expect(sorted[2].rank).toBe(1)
  })

  it("should handle empty widgets array", () => {
    const widgets: { Component: React.ComponentType; rank?: number }[] = []

    const sorted = sortWidgetsByRank(widgets)

    expect(sorted).toEqual([])
  })

  it("should handle single widget", () => {
    const widgets = [{ Component: MockComponent1, rank: 1 }]

    const sorted = sortWidgetsByRank(widgets)

    expect(sorted).toHaveLength(1)
    expect(sorted[0].rank).toBe(1)
  })

  it("should handle duplicate rank values", () => {
    const widgets = [
      { Component: MockComponent1, rank: 1 },
      { Component: MockComponent2, rank: 1 },
      { Component: MockComponent3, rank: 1 },
    ]

    const sorted = sortWidgetsByRank(widgets)

    // All should have rank 1
    expect(sorted[0].rank).toBe(1)
    expect(sorted[1].rank).toBe(1)
    expect(sorted[2].rank).toBe(1)
    expect(sorted).toHaveLength(3)
  })

  it("should handle all widgets without rank", () => {
    const widgets = [
      { Component: MockComponent1 },
      { Component: MockComponent2 },
      { Component: MockComponent3 },
    ]

    const sorted = sortWidgetsByRank(widgets)

    // Should maintain original order
    expect(sorted).toHaveLength(3)
    expect(sorted[0].Component).toBe(MockComponent1)
    expect(sorted[1].Component).toBe(MockComponent2)
    expect(sorted[2].Component).toBe(MockComponent3)
  })
})
