import { zodResolver } from "@hookform/resolvers/zod"
import { ThumbnailBadge } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, Checkbox, clx, CommandBar, toast, Tooltip } from "@medusajs/ui"
import { Fragment, useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import {
  useBatchVariantImages,
  useUpdateProductVariant,
} from "../../../../../hooks/api/products"

/**
 * Schema
 */
const MediaSchema = z.object({
  image_ids: z.array(z.string()),
  thumbnail: z.string().nullable(),
})

type MediaSchemaType = z.infer<typeof MediaSchema>

/**
 * Prop types
 */
type ProductVariantMediaViewProps = {
  variant: HttpTypes.AdminProductVariant & {
    images: HttpTypes.AdminProductImage[]
  }
}

export const EditProductVariantMediaForm = ({
  variant,
}: ProductVariantMediaViewProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const allProductImages = variant.product?.images || []
  // find images directly scoped to the variant without general product images
  const allVariantImages = (variant.images || []).filter((image) =>
    image.variants?.some((variant) => variant.id === variant.id)
  )

  const [selection, setSelection] = useState<Record<string, true>>(() =>
    allVariantImages.reduce(
      // @eslint-disable-next-line
      (acc: Record<string, true>, image) => {
        acc[image.id] = true
        return acc
      },
      {}
    )
  )

  const form = useForm<MediaSchemaType>({
    defaultValues: {
      image_ids: allVariantImages.map((image) => image.id!),
      thumbnail: variant.thumbnail,
    },
    resolver: zodResolver(MediaSchema),
  })

  const { mutateAsync: updateVariant } = useUpdateProductVariant(
    variant.product_id!,
    variant.id!
  )

  const { mutateAsync, isPending } = useBatchVariantImages(
    variant.product_id!,
    variant.id!
  )

  const handleSubmit = form.handleSubmit(async (data) => {
    const currentVariantImageIds = data.image_ids
    const newVariantImageIds = Object.keys(selection).filter(
      (id) => selection[id]
    )

    const imagesToAdd = newVariantImageIds.filter(
      (id) => !currentVariantImageIds.includes(id)
    )
    const imagesToRemove = currentVariantImageIds.filter(
      (id) => !newVariantImageIds.includes(id)
    )

    // Update thumbnail if it has changed
    if (data.thumbnail !== variant.thumbnail) {
      let thumbnail = data.thumbnail
      if (
        thumbnail &&
        ![...currentVariantImageIds, ...newVariantImageIds].includes(thumbnail)
      ) {
        thumbnail = null
      }
      updateVariant({
        thumbnail: data.thumbnail,
      }).catch((error) => {
        toast.error(error.message)
      })
    }

    // Update variant images
    await mutateAsync(
      {
        add: imagesToAdd,
        remove: imagesToRemove,
      },
      {
        onSuccess: () => {
          toast.success(t("products.media.successToast"))
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
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

  const handlePromoteToThumbnail = () => {
    const ids = Object.keys(selection)

    if (!ids.length) {
      return
    }

    const selectedImage = allProductImages.find((image) => image.id === ids[0])
    if (selectedImage) {
      form.setValue("thumbnail", selectedImage.url)
    }
  }

  const selectedImageThumbnail = form.watch("thumbnail")

  const isSelectedImageThumbnail =
    variant.thumbnail &&
    Object.keys(selection).length === 1 &&
    selectedImageThumbnail ===
      variant.images.find((image) => image.id === Object.keys(selection)[0])
        ?.url

  return (
    <RouteFocusModal.Form blockSearchParams form={form}>
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <div className="flex size-full flex-col-reverse lg:grid lg:grid-cols-[1fr]">
            <div className="bg-ui-bg-subtle size-full overflow-auto">
              <div className="grid h-fit auto-rows-auto grid-cols-6 gap-6 p-6">
                {allProductImages.map((image) => (
                  <MediaGridItem
                    key={image.id}
                    media={image}
                    checked={!!selection[image.id!]}
                    onCheckedChange={handleCheckedChange(image.id!)}
                    isThumbnail={image.url === form.watch("thumbnail")}
                  />
                ))}
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <CommandBar
          open={
            Object.keys(selection).length === 1 && !isSelectedImageThumbnail
          }
        >
          <CommandBar.Bar>
            <CommandBar.Value>
              {t("general.countSelected", {
                count: Object.keys(selection).length,
              })}
            </CommandBar.Value>
            <CommandBar.Seperator />
            <CommandBar.Command
              action={handlePromoteToThumbnail}
              label={t("products.media.makeThumbnail")}
              shortcut="t"
            />
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

/* ******************* * MEDIA VIEW ******************* */

interface MediaView {
  id: string
  url: string
}

interface MediaGridItemProps {
  media: MediaView
  checked: boolean
  onCheckedChange: (value: boolean) => void
  isThumbnail: boolean
}

const MediaGridItem = ({
  media,
  checked,
  onCheckedChange,
  isThumbnail,
}: MediaGridItemProps) => {
  const handleToggle = useCallback(
    (value: boolean) => {
      onCheckedChange(value)
    },
    [onCheckedChange]
  )

  const { t } = useTranslation()

  return (
    <div
      className={clx(
        "shadow-elevation-card-rest hover:shadow-elevation-card-hover focus-visible:shadow-borders-focus bg-ui-bg-subtle-hover group relative aspect-square h-auto max-w-full overflow-hidden rounded-lg outline-none"
      )}
    >
      {isThumbnail && (
        <div className="absolute left-2 top-2">
          <Tooltip content={t("products.media.thumbnailTooltip")}>
            <ThumbnailBadge />
          </Tooltip>
        </div>
      )}
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
      <img src={media.url} className="size-full object-cover object-center" />
    </div>
  )
}
