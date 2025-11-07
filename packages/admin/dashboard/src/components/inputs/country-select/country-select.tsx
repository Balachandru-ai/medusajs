import {
  ComponentPropsWithoutRef,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react"
import { useTranslation } from "react-i18next"
import { countries } from "../../../lib/data/countries"
import { Combobox } from "../combobox"

export const CountrySelect = forwardRef<
  HTMLInputElement,
  Omit<ComponentPropsWithoutRef<typeof Combobox>, "options" | "multiple"> & {
    placeholder?: string
    defaultValue?: string
    allowClear?: boolean
  }
>(({ placeholder, defaultValue, allowClear, onChange, value, ...props }, ref) => {
  const { t } = useTranslation()
  const innerRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => innerRef.current as HTMLInputElement)

  // Normalize the value: convert to lowercase
  // Keep empty string as empty string (don't convert to undefined)
  const normalizedValue = typeof value === "string"
    ? (value ? value.toLowerCase() : "")
    : ""

  const handleChange = (newValue: string | undefined) => {
    // Convert undefined to empty string when clearing
    onChange?.(newValue || "")
  }

  return (
    <Combobox
      {...props}
      ref={innerRef}
      value={normalizedValue}
      onChange={handleChange}
      options={countries.map((country) => ({
        label: country.display_name,
        value: country.iso_2.toLowerCase(),
      }))}
      placeholder={placeholder || t("fields.selectCountry")}
      allowClear={allowClear}
    />
  )
})

CountrySelect.displayName = "CountrySelect"
