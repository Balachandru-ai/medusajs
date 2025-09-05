import React from "react"
import { CheckCircleSolid } from "@medusajs/icons"
import { HeroPricingFields } from "../../../utils/types"
import { H3, Button } from "docs-ui"
import clsx from "clsx"
import slugify from "slugify"

interface HeroPricingProps {
  data: HeroPricingFields
}

const HeroPricing: React.FC<HeroPricingProps> = ({ data }) => {
  if (!data?.options) {
    return null
  }

  return (
    <div className="relative w-full">
      {/* Header Row */}
      <div className="flex items-start justify-start">
        {/* Main content area */}
        <div className="w-full flex items-center justify-start">
          {data.options.map((option, index) => (
            <React.Fragment key={option._key}>
              <div
                className={clsx(
                  `flex-1 min-w-0 px-1 py-1`,
                  index === 1 ? "bg-medusa-bg-base" : "bg-medusa-bg-subtle",
                  index !== data.options.length - 1 &&
                    "border-solid border-r border-medusa-border-base"
                )}
              >
                <div className="flex flex-col w-full">
                  <div className="flex flex-col items-start justify-start w-full">
                    <div className="flex flex-col justify-end w-full">
                      <H3
                        className="!mb-0"
                        id={slugify(option.title, {
                          lower: true,
                        })}
                      >
                        {option.title}
                      </H3>
                    </div>
                    <div className="flex flex-col justify-end w-full">
                      <p className="txt-medium-plus text-medusa-fg-subtle">
                        {option.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Features and Buttons Row */}
      <div
        className="w-full grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${data.options.length}, 1fr)`,
          gridTemplateRows: "auto 1fr auto",
        }}
      >
        {/* Description row - all descriptions at same height */}
        {data.options.map((option, index) => (
          <div
            key={`description-${option._key}`}
            className={clsx(
              `px-1 py-1 flex items-start`,
              index === 1 ? "bg-medusa-bg-base" : "bg-medusa-bg-subtle",
              index !== data.options.length - 1 &&
                "border-solid border-r border-medusa-border-base"
            )}
          >
            <div className="w-full flex items-start">
              {option.description && (
                <p className="text-medusa-fg-base txt-medium-plus text-balance">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Features row - all features sections at same level */}
        {data.options.map((option, index) => (
          <div
            key={`features-${option._key}`}
            className={clsx(
              `px-1 py-1 flex flex-col gap-0.75`,
              index === 1 ? "bg-medusa-bg-base" : "bg-medusa-bg-subtle",
              index !== data.options.length - 1 &&
                "border-solid border-r border-medusa-border-base"
            )}
          >
            {option.pre_features && (
              <div className="flex items-center w-full">
                <span className="text-medusa-fg-base txt-small-plus">
                  {option.pre_features}
                </span>
              </div>
            )}

            {option.features.map((feature, featureIndex) => (
              <div
                key={featureIndex}
                className="flex gap-0.75 items-center w-full text-medusa-fg-base"
              >
                <div className="flex gap-0.5 items-center">
                  <CheckCircleSolid />
                </div>
                <span className="txt-medium-plus">{feature}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Buttons row - all buttons at same level */}
        {data.options.map((option, index) => (
          <div
            key={`buttons-${option._key}`}
            className={clsx(
              `px-1 py-1`,
              index === 1 ? "bg-medusa-bg-base" : "bg-medusa-bg-subtle",
              index !== data.options.length - 1 &&
                "border-solid border-r border-medusa-border-base"
            )}
          >
            <div className="w-full">
              {option.buttons.map((button) => (
                <Button
                  key={button._key}
                  variant={
                    button.variant === "primary" || button.variant === "dark"
                      ? "primary"
                      : "secondary"
                  }
                  className="w-full txt-compact-xsmall-plus"
                >
                  {button.link.label}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HeroPricing
