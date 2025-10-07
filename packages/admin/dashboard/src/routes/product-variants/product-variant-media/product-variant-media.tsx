import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteFocusModal } from "../../../components/modals"
import { useProductVariant } from "../../../hooks/api/products"
import { EditProductVariantMediaForm } from "./components/edit-product-variant-media-form"

export const ProductVariantMedia = () => {
  const { t } = useTranslation()
  const { id, variant_id } = useParams()

  const { variant, isLoading, isError, error } = useProductVariant(
    id!,
    variant_id!,
    { fields: "*product,*product.images,+images.variants.id" }
  )

  const ready = !isLoading && variant

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.media.label")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.media.editHint")}</span>
      </RouteFocusModal.Description>
      {ready && <EditProductVariantMediaForm variant={variant} />}
    </RouteFocusModal>
  )
}
