import React from "react"
import { describe, expect, test } from "vitest"
import { render } from "@testing-library/react"
import { ShadedBlock } from "../index"

describe("rendering", () => {
  test("renders shaded block with default variant", () => {
    const { container } = render(<ShadedBlock />)
    expect(container).toBeInTheDocument()
    const div = container.querySelector("div")
    expect(div).toBeInTheDocument()
    expect(div).toHaveClass("bg-repeat")
    expect(div).toHaveClass("h-full")
    expect(div).toHaveClass("w-auto")
    expect(div).toHaveClass("bg-bg-stripes")
    expect(div).toHaveClass("dark:bg-bg-stripes-dark")
  })

  test("renders shaded block with subtle variant", () => {
    const { container } = render(<ShadedBlock variant="subtle" />)
    expect(container).toBeInTheDocument()
    const div = container.querySelector("div")
    expect(div).toBeInTheDocument()
    expect(div).toHaveClass("bg-repeat")
    expect(div).toHaveClass("bg-bg-stripes-subtle")
    expect(div).toHaveClass("dark:bg-bg-stripes-subtle-dark")
    expect(div).not.toHaveClass("bg-bg-stripes")
  })

  test("renders with custom className", () => {
    const { container } = render(<ShadedBlock className="custom-class" />)
    expect(container).toBeInTheDocument()
    const div = container.querySelector("div")
    expect(div).toBeInTheDocument()
    expect(div).toHaveClass("custom-class")
    expect(div).toHaveClass("bg-repeat")
  })
})
