import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Checkbox, clx, toast } from "@medusajs/ui"
import { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"

type ProductVariantMediaViewProps = {
  variant: HttpTypes.AdminProductVariant
}

const MediaSchema = z.object({
  image_ids: z.array(z.string()),
})

type MediaSchemaType = z.infer<typeof MediaSchema>

export const EditProductVariantMediaForm = ({
  variant,
}: ProductVariantMediaViewProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const [selection, setSelection] = useState<Record<string, true>>(
    variant.images
      .filter((image) =>
        image.variants?.some((variant) => variant.id === variant.id)
      )
      .reduce(
        (acc, image) => {
          acc[image.id] = true
          return acc
        },

        {} as Record<string, true>
      )
  )

  const form = useForm<MediaSchemaType>({
    defaultValues: {
      image_ids: Object.keys(selection),
    },
    resolver: zodResolver(MediaSchema),
  })

  // @ts-ignore
  const { mutateAsync, isPending } = {}

  const handleSubmit = form.handleSubmit(async ({ media }) => {
    await mutateAsync(
      {},
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
                {variant.product.images?.map((image) => (
                  <MediaGridItem
                    key={image.id}
                    media={image}
                    checked={!!selection[image.id!]}
                    onCheckedChange={handleCheckedChange(image.id!)}
                  />
                ))}
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
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

interface MediaView {
  id: string
  url: string
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
