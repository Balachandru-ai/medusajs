import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { json, useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { VariantsTable } from "./components/variants-table/variants-table"
import { useProduct } from "../../../hooks/api"

export const ProductImageVariants = () => {
  const { t } = useTranslation()

  const { id: product_id, image_id } = useParams<{
    id: string
    image_id: string
  }>()

  const { product, isPending } = useProduct(
    product_id!,
    { fields: "images.id,images.url,images.variants.id" },
    {
      enabled: !!product_id && !!image_id,
    }
  )

  const image = product?.images?.find((image) => image.id === image_id)

  if (!product_id || !image_id || isPending) {
    return null
  }

  if (isPending && !image) {
    throw json({ message: `An image with ID ${image_id} was not found` }, 404)
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <div className="flex items-center gap-x-4">
          <img src={image.url} className="h-20" />
          <div>
            <RouteDrawer.Title asChild>
              <Heading>{t("products.variantMedia.manageVariants")}</Heading>
            </RouteDrawer.Title>
            <RouteDrawer.Description>
              {t("products.variantMedia.manageVariantsDescription")}
            </RouteDrawer.Description>
          </div>
        </div>
      </RouteDrawer.Header>
      <VariantsTable productId={product_id} image={image} />
    </RouteDrawer>
  )
}
