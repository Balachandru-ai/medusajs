import { XMark } from "@medusajs/icons"
import { Button, clx, Heading, IconButton, Textarea } from "@medusajs/ui"
import { Popover as RadixPopover } from "radix-ui"
import { useCallback, useEffect, useRef, useState } from "react"
import { Controller, ControllerRenderProps } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useCombinedRefs } from "../../../hooks/use-combined-refs"
import { useDataGridCell, useDataGridCellError } from "../hooks"
import { DataGridCellProps, InputProps } from "../types"
import { DataGridCellContainer } from "./data-grid-cell-container"

type DataGridTextAreaModalCellProps<TData, TValue = any> = DataGridCellProps<
  TData,
  TValue
> & {
  fieldLabel?: string
}

export const DataGridExpandableTextCell = <TData, TValue = any>({
  context,
  fieldLabel,
}: DataGridTextAreaModalCellProps<TData, TValue>) => {
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
          <Inner
            field={field}
            inputProps={input}
            fieldLabel={fieldLabel}
            container={container}
            errorProps={errorProps}
          />
        )
      }}
    />
  )
}

const Inner = ({
  field,
  inputProps,
  fieldLabel,
  container,
  errorProps,
}: {
  field: ControllerRenderProps<any, string>
  inputProps: InputProps
  fieldLabel?: string
  container: any
  errorProps: any
}) => {
  const { t } = useTranslation()
  const { onChange: _, onBlur, ref, value, ...rest } = field
  const { ref: inputRef, onBlur: onInputBlur, onChange, ...input } = inputProps

  const [localValue, setLocalValue] = useState(value || "")
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [popoverValue, setPopoverValue] = useState(value || "")
  const popoverContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalValue(value || "")
  }, [value])

  useEffect(() => {
    if (isPopoverOpen) {
      setPopoverValue(value || "")
    }
  }, [isPopoverOpen, value])

  // Prevent DataGrid keyboard handlers from intercepting keys when popover is open
  useEffect(() => {
    if (!isPopoverOpen || !popoverContentRef.current) {
      return
    }

    const handleKeyDownCapture = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isTextarea = target.tagName === "TEXTAREA"
      const isInPopover =
        popoverContentRef.current && popoverContentRef.current.contains(target)

      if (isTextarea || isInPopover) {
        const dataGridKeys = [
          "Enter",
          "Delete",
          "Backspace",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Tab",
          " ",
        ]

        // Stop the keys from reaching DataGrid, so the textarea can handle them
        if (dataGridKeys.includes(e.key) && e.key !== "Escape") {
          e.stopImmediatePropagation()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDownCapture, true)

    return () => {
      window.removeEventListener("keydown", handleKeyDownCapture, true)
    }
  }, [isPopoverOpen])

  const combinedRefs = useCombinedRefs(inputRef, ref)

  const handleOverlayMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.detail === 2) {
        e.preventDefault()
        e.stopPropagation()
        setIsPopoverOpen(true)
        return
      }
      container.overlayProps.onMouseDown?.(e)
    },
    [container.overlayProps]
  )

  const customContainer = {
    ...container,
    overlayProps: {
      ...container.overlayProps,
      onMouseDown: handleOverlayMouseDown,
    },
  }

  const handlePopoverSave = () => {
    onChange(popoverValue, value)
    setLocalValue(popoverValue)
    setIsPopoverOpen(false)
    onBlur()
    onInputBlur()
  }

  const handlePopoverCancel = () => {
    setPopoverValue(value || "")
    setIsPopoverOpen(false)
  }

  const handlePopoverKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Escape") {
      e.stopPropagation()
    }
  }, [])

  const displayValue = localValue || ""
  const truncatedValue =
    displayValue.length > 50
      ? `${displayValue.substring(0, 50)}...`
      : displayValue

  return (
    <RadixPopover.Root
      open={isPopoverOpen}
      onOpenChange={(open) => {
        if (!open) {
          handlePopoverCancel()
        } else {
          setIsPopoverOpen(true)
        }
      }}
    >
      <DataGridCellContainer {...customContainer} {...errorProps}>
        <RadixPopover.Anchor asChild>
          <div
            className={clx(
              "txt-compact-small text-ui-fg-subtle flex size-full cursor-pointer items-center justify-center bg-transparent outline-none",
              "focus:cursor-text"
            )}
          >
            <span className="w-full truncate text-center">
              {truncatedValue}
            </span>
          </div>
        </RadixPopover.Anchor>
        <input
          className="sr-only"
          autoComplete="off"
          tabIndex={-1}
          value={localValue}
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
      </DataGridCellContainer>
      <RadixPopover.Portal>
        <RadixPopover.Content
          className={clx(
            "bg-ui-bg-subtle shadow-elevation-flyout flex max-h-[80vh] w-[600px] flex-col overflow-hidden rounded-lg outline-none"
          )}
          align="start"
          side="bottom"
          sideOffset={8}
          collisionPadding={24}
          onEscapeKeyDown={handlePopoverCancel}
          onKeyDown={handlePopoverKeyDown}
        >
          <div ref={popoverContentRef} className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <Heading>
                {fieldLabel
                  ? t(`fields.${fieldLabel}`, { defaultValue: fieldLabel })
                  : t("translations.edit.field", {
                      defaultValue: "Edit Field",
                    })}
              </Heading>
              <IconButton
                variant="transparent"
                size="small"
                onClick={handlePopoverCancel}
              >
                <XMark />
              </IconButton>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <Textarea
                value={popoverValue}
                onChange={(e) => setPopoverValue(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                }}
                className="min-h-[300px] w-full"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-x-2 border-t px-6 py-4">
              <Button
                variant="primary"
                size="small"
                onClick={handlePopoverSave}
              >
                {t("actions.save")}
              </Button>
            </div>
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}
