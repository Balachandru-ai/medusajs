import { zodResolver } from "@hookform/resolvers/zod"
import { ThumbnailBadge } from "@medusajs/icons"
import { Button, Checkbox, clx, CommandBar, Tooltip } from "@medusajs/ui"
import { Fragment, useCallback, useState, useMemo } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import {
  createColumnHelper,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table"

import { AdminProduct } from "@medusajs/types"

import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import {
  EditProductMediaSchema,
  MediaSchema,
} from "../../../product-create/constants"
import { EditProductMediaSchemaType } from "../../../product-create/types"
import { _DataTable } from "../../../../../components/table/data-table"
import { useDataTable } from "../../../../../hooks/use-data-table"

type ProductVarianstMediaViewProps = {
  product: AdminProduct
}

type Media = z.infer<typeof MediaSchema>

const variantColumnHelper =
  createColumnHelper<NonNullable<AdminProduct["variants"]>[0]>()

export const EditProductVariantsMediaForm = ({
  product,
}: ProductVarianstMediaViewProps) => {
  const [selection, setSelection] = useState<Record<string, true>>({})
  const [showVariantsTable, setShowVariantsTable] = useState(false)
  const [variantSelection, setVariantSelection] = useState<RowSelectionState>(
    {}
  )
  const { t } = useTranslation()
  const { handleSuccess: _handleSuccess } = useRouteModal()

  const form = useForm<EditProductMediaSchemaType>({
    defaultValues: {
      media: getDefaultValues(product.images, product.thumbnail),
    },
    resolver: zodResolver(EditProductMediaSchema),
  })

  const {
    fields,
    append: _append,
    remove: _remove,
    update: _update,
  } = useFieldArray({
    name: "media",
    control: form.control,
    keyName: "field_id",
  })

  const { mutateAsync: _mutateAsync, isPending } = {
    mutateAsync: async () => {},
    isPending: false,
  } // TODO

  const handleSubmit = form.handleSubmit(async ({ media: _media }) => {
    await _mutateAsync() // TODO
  })

  const handleCheckedChange = useCallback(
    (id: string) => {
      return (val: boolean) => {
        if (!val) {
          const { [id]: _, ...rest } = selection
          setSelection(rest)
        } else {
          setSelection((prev) => ({ ...prev, [id]: true }))
        }
      }
    },
    [selection]
  )

  const handleManageVariants = () => {
    setShowVariantsTable(!showVariantsTable)
  }

  const handleAddToMultipleVariants = () => {
    setShowVariantsTable(!showVariantsTable)
  }

  const selectionCount = Object.keys(selection).length

  return (
    <RouteFocusModal.Form blockSearchParams form={form}>
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <div className="flex size-full flex-col-reverse lg:grid lg:grid-cols-[1fr_560px]">
            <div className="bg-ui-bg-subtle size-full overflow-auto">
              <div className="grid h-fit auto-rows-auto grid-cols-4 gap-6 p-6">
                {fields.map((m) => {
                  return (
                    <MediaGridItem
                      onCheckedChange={handleCheckedChange(m.id!)}
                      checked={!!selection[m.id!]}
                      key={m.field_id}
                      media={m}
                    />
                  )
                })}
              </div>
            </div>
            <div className="bg-ui-bg-base overflow-auto border-b px-6 py-4 lg:border-b-0 lg:border-l">
              {showVariantsTable ? (
                <VariantsTable
                  variants={product.variants || []}
                  variantSelection={variantSelection}
                  setVariantSelection={setVariantSelection}
                />
              ) : (
                <div className="text-ui-fg-muted flex h-full items-center justify-center">
                  Select media to manage variants
                </div>
              )}
            </div>
          </div>
        </RouteFocusModal.Body>
        <CommandBar open={!!selectionCount}>
          <CommandBar.Bar>
            <CommandBar.Value>
              {t("general.countSelected", {
                count: selectionCount,
              })}
            </CommandBar.Value>
            <CommandBar.Seperator />
            {selectionCount === 1 && (
              <Fragment>
                <CommandBar.Command
                  action={handleManageVariants}
                  label={t("products.variantMedia.manageVariants")}
                  shortcut="M"
                />
                <CommandBar.Seperator />
              </Fragment>
            )}
            {selectionCount > 1 && (
              <CommandBar.Command
                action={handleAddToMultipleVariants}
                label={t("products.variantMedia.addToMultipleVariants")}
                shortcut="M"
              />
            )}
          </CommandBar.Bar>
        </CommandBar>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

const getDefaultValues = (
  images: any[] | null | undefined,
  thumbnail: string | null | undefined
) => {
  const media: Media[] =
    images?.map((image) => ({
      id: image.id!,
      url: image.url!,
      isThumbnail: image.url === thumbnail,
      file: null,
    })) || []

  if (thumbnail && !media.some((mediaItem) => mediaItem.url === thumbnail)) {
    const id = Math.random().toString(36).substring(7)

    media.unshift({
      id: id,
      url: thumbnail,
      isThumbnail: true,
      file: null,
    })
  }

  return media
}

interface MediaView {
  id?: string
  field_id: string
  url: string
  isThumbnail: boolean
}

interface MediaGridItemProps {
  media: MediaView
  checked: boolean
  onCheckedChange: (value: boolean) => void
}

const MediaGridItem = ({
  media,
  checked,
  onCheckedChange,
}: MediaGridItemProps) => {
  const { t: _t } = useTranslation()

  const handleToggle = useCallback(
    (value: boolean) => {
      onCheckedChange(value)
    },
    [onCheckedChange]
  )

  return (
    <div
      className={clx(
        "shadow-elevation-card-rest hover:shadow-elevation-card-hover focus-visible:shadow-borders-focus bg-ui-bg-subtle-hover group relative aspect-square h-auto max-w-full overflow-hidden rounded-lg outline-none"
      )}
    >
      {media.isThumbnail && (
        <div className="absolute left-2 top-2">
          <Tooltip content="Thumbnail">
            <ThumbnailBadge />
          </Tooltip>
        </div>
      )}
      <div
        className={clx(
          "absolute inset-0 cursor-grab touch-none outline-none",
          {}
        )}
      />
      <div
        className={clx("transition-fg absolute right-2 top-2 opacity-0", {
          "group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100":
            !checked,
          "opacity-100": checked,
        })}
      >
        <Checkbox
          onClick={(e) => {
            e.stopPropagation()
          }}
          checked={checked}
          onCheckedChange={handleToggle}
        />
      </div>
      <img
        src={media.url}
        alt=""
        className="size-full object-cover object-center"
      />
    </div>
  )
}

export const MediaGridItemOverlay = ({
  media,
  checked,
}: {
  media: MediaView
  checked: boolean
}) => {
  return (
    <div className="shadow-elevation-card-rest hover:shadow-elevation-card-hover focus-visible:shadow-borders-focus bg-ui-bg-subtle-hover group relative aspect-square h-auto max-w-full cursor-grabbing overflow-hidden rounded-lg outline-none">
      {media.isThumbnail && (
        <div className="absolute left-2 top-2">
          <ThumbnailBadge />
        </div>
      )}
      <div
        className={clx("transition-fg absolute right-2 top-2 opacity-0", {
          "opacity-100": checked,
        })}
      >
        <Checkbox checked={checked} />
      </div>
      <img
        src={media.url}
        alt=""
        className="size-full object-cover object-center"
      />
    </div>
  )
}

type VariantsTableProps = {
  variants: AdminProduct["variants"]
  variantSelection: RowSelectionState
  setVariantSelection: (selection: RowSelectionState) => void
}

const VariantsTable = ({
  variants,
  variantSelection,
  setVariantSelection,
}: VariantsTableProps) => {
  const { t } = useTranslation()

  const columns = useMemo(
    () => [
      variantColumnHelper.display({
        id: "select",
        header: ({ table }) => {
          return (
            <Checkbox
              checked={
                table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : table.getIsAllPageRowsSelected()
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
            />
          )
        },
        cell: ({ row }) => {
          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              onClick={(e) => {
                e.stopPropagation()
              }}
            />
          )
        },
      }),
      variantColumnHelper.accessor("title", {
        header: () => t("fields.title"),
        cell: ({ getValue }) => {
          const title = getValue()
          return (
            <div className="flex h-full w-full items-center">
              <span className="truncate">{title || "-"}</span>
            </div>
          )
        },
      }),
      variantColumnHelper.accessor("sku", {
        header: () => t("fields.sku"),
        cell: ({ getValue }) => {
          const sku = getValue()
          return (
            <div className="flex h-full w-full items-center">
              <span className="truncate font-mono text-sm">{sku || "-"}</span>
            </div>
          )
        },
      }),
      variantColumnHelper.accessor("manage_inventory", {
        header: () => t("fields.manageInventory"),
        cell: ({ getValue }) => {
          const manageInventory = getValue()
          return (
            <div className="flex h-full w-full items-center">
              <span className="truncate">{manageInventory ? "Yes" : "No"}</span>
            </div>
          )
        },
      }),
    ],
    [t]
  )

  const updater: OnChangeFn<RowSelectionState> = (value) => {
    const state = typeof value === "function" ? value(variantSelection) : value
    setVariantSelection(state)
  }

  const { table } = useDataTable({
    data: variants || [],
    columns,
    count: variants?.length || 0,
    enablePagination: true,
    enableRowSelection: true,
    pageSize: 20,
    getRowId: (row) => row.id,
    rowSelection: {
      state: variantSelection,
      updater,
    },
  })

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <p className="ui-fg- my-4 text-sm">Select variants to assign media</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <_DataTable
          table={table}
          columns={columns}
          count={variants?.length || 0}
          isLoading={false}
          layout="fill"
          noHeader
          pageSize={variants?.length || 0}
        />
      </div>
    </div>
  )
}
