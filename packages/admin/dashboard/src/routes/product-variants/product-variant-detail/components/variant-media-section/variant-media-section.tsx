import { Container, Heading, Text, clx } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { HttpTypes } from "@medusajs/types"
import { PencilSquare } from "@medusajs/icons"
import { ActionMenu } from "../../../../../components/common/action-menu"

type VariantMediaSectionProps = {
  variant: HttpTypes.AdminProductVariant
}

export const VariantMediaSection = ({ variant }: VariantMediaSectionProps) => {
  const { t } = useTranslation()

  const [selection, setSelection] = useState<Record<string, boolean>>({})

  const media = variant.images || []

  // const handleCheckedChange = (id: string) => {
  //   setSelection((prev) => {
  //     if (prev[id]) {
  //       const { [id]: _, ...rest } = prev
  //       return rest
  //     } else {
  //       return { ...prev, [id]: true }
  //     }
  //   })
  // }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.media.label")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.editImages"),
                  to: "media",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
        />
      </div>
      {media.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-4 px-6 py-4">
          {media.map((i, index) => {
            // const isSelected = selection[i.id]

            return (
              <div
                className="shadow-elevation-card-rest hover:shadow-elevation-card-hover transition-fg group relative aspect-square size-full overflow-hidden rounded-[8px]"
                key={i.id}
              >
                <div
                  className={clx(
                    "transition-fg invisible absolute right-2 top-2 opacity-0 group-hover:visible group-hover:opacity-100"
                    // {
                    //   "visible opacity-100": isSelected,
                    // }
                  )}
                >
                  {/* <Checkbox
                    checked={selection[i.id] || false}
                    onCheckedChange={() => handleCheckedChange(i.id)}
                  /> */}
                </div>
                <Link to={`media`} state={{ curr: index }}>
                  <img src={i.url} className="size-full object-cover" />
                </Link>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-y-4 pb-8 pt-6">
          <div className="flex flex-col items-center">
            <Text
              size="small"
              leading="compact"
              weight="plus"
              className="text-ui-fg-subtle"
            >
              {t("products.media.emptyState.header")}
            </Text>
            <Text size="small" className="text-ui-fg-muted">
              {t("products.media.emptyState.description")}
            </Text>
          </div>
        </div>
      )}
    </Container>
  )
}
