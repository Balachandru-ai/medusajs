import {
  ComponentPropsWithoutRef,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react"

import { TrianglesMini } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { countries } from "../../../lib/data/countries"
import { Select } from "@medusajs/ui"

export const CountrySelect = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof Select> & {
    placeholder?: string
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
  }
>(({ disabled, placeholder, value, defaultValue, onChange }, ref) => {
  const { t } = useTranslation()
  const innerRef = useRef<HTMLButtonElement>(null)

  useImperativeHandle(ref, () => innerRef.current as HTMLButtonElement)

  return (
    <div className="relative">
      <TrianglesMini
        className={clx(
          "text-ui-fg-muted transition-fg pointer-events-none absolute right-2 top-1/2 -translate-y-1/2",
          {
            "text-ui-fg-disabled": disabled,
          }
        )}
      />
      <Select
        value={value ? value.toLowerCase() : undefined}
        onValueChange={onChange}
        defaultValue={defaultValue ? defaultValue.toLowerCase() : undefined}
        disabled={disabled}
      >
        <Select.Trigger ref={innerRef} className="w-full">
          <Select.Value
            placeholder={placeholder || t("fields.selectCountry")}
          />
        </Select.Trigger>
        <Select.Content>
          {countries.map((country) => (
            <Select.Item
              key={country.iso_2}
              value={country.iso_2.toLowerCase()}
            >
              {country.display_name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  )
})
CountrySelect.displayName = "CountrySelect"
