import { AdminProduct } from "@medusajs/types"

import { EditProductVariantsMediaForm } from "../edit-product-variants-media-form"

type ProductVariantsMediaViewProps = {
  product: AdminProduct
}

export const ProductVariantsMediaView = ({
  product,
}: ProductVariantsMediaViewProps) => {
  return <EditProductVariantsMediaForm product={product} />
}
