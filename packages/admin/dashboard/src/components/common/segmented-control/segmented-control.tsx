import { clx, Label } from "@medusajs/ui"
import { ReactNode } from "react"
import { Text } from "@medusajs/ui"

export type SegmentedControlOption = {
  value: string
  label: ReactNode
}

type SegmentedControlProps = {
  value: string
  onValueChange: (value: string) => void
  options: SegmentedControlOption[]
  className?: string
}

export const SegmentedControl = ({
  value,
  onValueChange,
  options,
  className,
}: SegmentedControlProps) => {
  return (
    <div
      className={clx(
        "bg-ui-bg-disabled flex items-center gap-x-1 rounded-md p-[1px]",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value

        return (
          <button
            key={option.value}
            onClick={() => onValueChange(option.value)}
            className={clx(
              "rounded-md px-2 py-1 text-sm transition-colors",
              isSelected
                ? "bg-ui-bg-base text-ui-fg-base"
                : "text-ui-fg-muted hover:text-ui-fg-base"
            )}
            type="button"
          >
            <Label className="txt-ui-fg-base txt-compact-small-plus">
              {option.label}
            </Label>
          </button>
        )
      })}
    </div>
  )
}
