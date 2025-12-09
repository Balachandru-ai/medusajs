import { XMark } from "@medusajs/icons"
import { Button, clx, Heading, IconButton, Textarea } from "@medusajs/ui"
import { Dialog as RadixDialog } from "radix-ui"
import { useCallback, useEffect, useState } from "react"
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalValue, setModalValue] = useState(value || "")

  useEffect(() => {
    setLocalValue(value || "")
  }, [value])

  useEffect(() => {
    if (isModalOpen) {
      setModalValue(value || "")
    }
  }, [isModalOpen, value])

  const combinedRefs = useCombinedRefs(inputRef, ref)

  const handleOverlayMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.detail === 2) {
        e.preventDefault()
        e.stopPropagation()
        setIsModalOpen(true)
        return
      }
      container.overlayProps.onMouseDown?.(e)
    },
    [container.overlayProps]
  )

  // Create custom container props with overridden overlay
  const customContainer = {
    ...container,
    overlayProps: {
      ...container.overlayProps,
      onMouseDown: handleOverlayMouseDown,
    },
  }

  const handleModalSave = () => {
    onChange(modalValue, value)
    setLocalValue(modalValue)
    setIsModalOpen(false)
    onBlur()
    onInputBlur()
  }

  const handleModalCancel = () => {
    setModalValue(value || "")
    setIsModalOpen(false)
  }

  const displayValue = localValue || ""
  const truncatedValue =
    displayValue.length > 50
      ? `${displayValue.substring(0, 50)}...`
      : displayValue

  return (
    <>
      <DataGridCellContainer {...customContainer} {...errorProps}>
        <div
          className={clx(
            "txt-compact-small text-ui-fg-subtle flex size-full cursor-pointer items-center justify-center bg-transparent outline-none",
            "focus:cursor-text"
          )}
        >
          <span className="w-full truncate text-center">{truncatedValue}</span>
        </div>
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
      <RadixDialog.Root
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleModalCancel()
          } else {
            setIsModalOpen(true)
          }
        }}
      >
        <RadixDialog.Portal>
          <RadixDialog.Overlay
            className={clx(
              "bg-ui-bg-overlay fixed inset-0",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            )}
          />
          <RadixDialog.Content
            className="bg-ui-bg-subtle shadow-elevation-modal fixed left-[50%] top-[50%] flex max-h-[80vh] w-full max-w-[600px] translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-lg outline-none"
            onEscapeKeyDown={handleModalCancel}
            onPointerDownOutside={handleModalCancel}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <RadixDialog.Title asChild>
                <Heading>
                  {fieldLabel
                    ? t(`fields.${fieldLabel}`, { defaultValue: fieldLabel })
                    : t("translations.edit.field", {
                        defaultValue: "Edit Field",
                      })}
                </Heading>
              </RadixDialog.Title>
              <RadixDialog.Close asChild>
                <IconButton variant="transparent" size="small">
                  <XMark />
                </IconButton>
              </RadixDialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <Textarea
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                className="min-h-[300px] w-full"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-x-2 border-t px-6 py-4">
              <RadixDialog.Close asChild>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleModalCancel}
                >
                  {t("actions.cancel")}
                </Button>
              </RadixDialog.Close>
              <Button variant="primary" size="small" onClick={handleModalSave}>
                {t("actions.save")}
              </Button>
            </div>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </>
  )
}
