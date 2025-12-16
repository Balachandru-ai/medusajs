import { clx } from "@medusajs/ui"
import { useCallback, useEffect, useRef, useState } from "react"
import { Controller, ControllerRenderProps } from "react-hook-form"

import { useCombinedRefs } from "../../../hooks/use-combined-refs"
import { useDataGridCell, useDataGridCellError } from "../hooks"
import { DataGridCellProps, InputProps } from "../types"
import { DataGridCellContainer } from "./data-grid-cell-container"

type DataGridTextCellProps<TData, TValue = any> = DataGridCellProps<
  TData,
  TValue
> & {
  isMultiLine?: boolean
}

export const DataGridTextCell = <TData, TValue = any>({
  context,
  isMultiLine = false,
}: DataGridTextCellProps<TData, TValue>) => {
  const { field, control, renderProps } = useDataGridCell({
    context,
  })
  const errorProps = useDataGridCellError({ context })

  const { container, input } = renderProps

  return (
    <Controller
      control={control}
      name={field}
      render={({ field }) => {
        return (
          <DataGridCellContainer
            {...container}
            {...errorProps}
            isMultiLine={isMultiLine}
          >
            <Inner field={field} inputProps={input} isMultiLine={isMultiLine} />
          </DataGridCellContainer>
        )
      }}
    />
  )
}

const Inner = ({
  field,
  inputProps,
  isMultiLine,
}: {
  field: ControllerRenderProps<any, string>
  inputProps: InputProps
  isMultiLine: boolean
}) => {
  const { onChange: _, onBlur, ref, value, ...rest } = field
  const { ref: inputRef, onBlur: onInputBlur, onChange, ...input } = inputProps

  const [localValue, setLocalValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const combinedRefs = useCombinedRefs(inputRef, ref)
  const textareaCombinedRefs = useCombinedRefs(inputRef, ref, textareaRef)

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to 0 to get accurate scrollHeight
      textarea.style.height = "0px"
      // Set the height to match content (minimum 24px for min visible height)
      const newHeight = Math.max(textarea.scrollHeight, 24)
      textarea.style.height = `${newHeight}px`
    }
  }, [])

  // Adjust height when value changes
  useEffect(() => {
    if (isMultiLine) {
      adjustTextareaHeight()
    }
  }, [localValue, isMultiLine, adjustTextareaHeight])

  useEffect(() => {
    if (isMultiLine) {
      // Immediate adjustment
      adjustTextareaHeight()
      // Delayed adjustment to handle any layout shifts
      const timeoutId = setTimeout(adjustTextareaHeight, 50)
      return () => clearTimeout(timeoutId)
    }
  }, [isMultiLine, adjustTextareaHeight])

  if (isMultiLine) {
    return (
      <textarea
        className={clx(
          "txt-compact-small text-ui-fg-subtle flex w-full cursor-pointer bg-transparent outline-none",
          "focus:cursor-text",
          "resize-none overflow-hidden py-2"
        )}
        autoComplete="off"
        tabIndex={-1}
        value={localValue ?? ""}
        onChange={(e) => {
          setLocalValue(e.target.value)
          adjustTextareaHeight()
        }}
        ref={textareaCombinedRefs}
        onBlur={() => {
          onBlur()
          onInputBlur()
          onChange(localValue, value)
        }}
        {...input}
        {...rest}
      />
    )
  }

  return (
    <input
      className={clx(
        "txt-compact-small text-ui-fg-subtle flex size-full cursor-pointer bg-transparent outline-none",
        "focus:cursor-text",
        "items-center justify-center"
      )}
      autoComplete="off"
      tabIndex={-1}
      value={localValue ?? ""}
      onChange={(e) => setLocalValue(e.target.value)}
      ref={combinedRefs}
      onBlur={() => {
        onBlur()
        onInputBlur()
        onChange(localValue, value)
      }}
      {...input}
      {...rest}
    />
  )
}
