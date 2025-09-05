import React from "react"
import clsx from "clsx"
import {
  FeatureTableFields,
  Block,
  Span,
  TooltipBlock,
} from "../../../utils/types"
import { H3, MarkdownContent, MDXComponents } from "docs-ui"
import slugify from "slugify"

const P = MDXComponents.p

interface FeatureSectionsProps {
  featureSections: FeatureTableFields["featureSections"]
  columnCount: number
  columns: string[]
}

// Helper function to render Block content (Sanity rich text)
const renderBlockContent = (blocks: Block[]) => {
  if (!blocks || blocks.length === 0) {
    return ""
  }

  return blocks
    .map((block) => {
      if (block._type === "block" && block.children) {
        return block.children
          .map((child: Span | TooltipBlock) => {
            if (child._type === "span") {
              return child.text
            }
            return ""
          })
          .join("  \n")
      }
      return ""
    })
    .join("  \n")
    .replaceAll("-", "\\-")
}

const FeatureSections: React.FC<FeatureSectionsProps> = ({
  featureSections,
  columnCount,
  columns,
}) => {
  if (!featureSections || featureSections.length === 0) {
    return null
  }

  // Calculate consistent column widths
  // Use fractional units to ensure all grids have matching column sizes
  const featureNameFraction = 2 // Feature name gets 2 units
  const featureColumnFraction = 1 // Each feature column gets 1 unit
  const gridTemplate = `${featureNameFraction}fr repeat(${columnCount}, ${featureColumnFraction}fr)`

  return (
    <div className="w-full flex flex-col">
      {featureSections.map((section) => (
        <div key={section._key} className="w-full">
          {/* Section Header */}
          <H3 id={slugify(section.header.subtitle, { lower: true })}>
            {section.header.subtitle}
          </H3>
          {/* @ts-expect-error this is a React component */}
          <P>{section.header.title}</P>

          {/* Column Headers for this section */}
          <div
            className="w-full grid gap-0 border-b border-solid border-medusa-border-base"
            style={{
              gridTemplateColumns: gridTemplate,
            }}
          >
            {/* Features label column */}
            <div className="flex items-center justify-start px-1 py-1 bg-medusa-bg-base border-solid border-r border-medusa-border-base">
              <p className="txt-medium-plus text-medusa-fg-base">Features</p>
            </div>

            {/* Column headers */}
            {columns.map((column, index) => (
              <div
                key={index}
                className={clsx(
                  "flex items-center justify-center px-1 py-1 bg-medusa-bg-base",
                  index !== columns.length - 1 &&
                    "border-solid border-r border-medusa-border-base"
                )}
              >
                <p className="txt-medium text-medusa-fg-base text-center w-full">
                  {column}
                </p>
              </div>
            ))}
          </div>

          {/* Section Rows */}
          <div className="w-full">
            {section.rows.map((row) => (
              <React.Fragment key={row._key}>
                <div
                  className="w-full grid gap-0 border-b border-solid border-medusa-border-base"
                  style={{
                    gridTemplateColumns: gridTemplate,
                  }}
                >
                  {/* Feature name column */}
                  <div className="px-1 py-1 flex items-center justify-start border-solid border-r border-medusa-border-base">
                    <p className="txt-medium-plus text-medusa-fg-base">
                      <MarkdownContent
                        allowedElements={["br"]}
                        unwrapDisallowed
                      >
                        {renderBlockContent(row.column1)}
                      </MarkdownContent>
                    </p>
                  </div>

                  {/* Feature value columns */}
                  {Array.from({ length: columnCount }, (_, colIndex) => {
                    const columnKey = `column${
                      colIndex + 2
                    }` as keyof typeof row
                    const columnData = row[columnKey] as Block[]

                    return (
                      <div
                        key={colIndex}
                        className={clsx(
                          "px-1 py-1 flex items-center justify-center bg-medusa-bg-base",
                          colIndex !== columnCount - 1 &&
                            "border-solid border-r border-medusa-border-base"
                        )}
                      >
                        <p className="txt-medium text-medusa-fg-base text-center w-full">
                          <MarkdownContent
                            allowedElements={["br"]}
                            unwrapDisallowed
                          >
                            {renderBlockContent(columnData)}
                          </MarkdownContent>
                        </p>
                      </div>
                    )
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default FeatureSections
