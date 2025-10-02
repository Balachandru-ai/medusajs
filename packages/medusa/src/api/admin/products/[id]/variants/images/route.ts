import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { HttpTypes } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminAssignImagesToVariantsRequest>,
  res: MedusaResponse<HttpTypes.AdminAssignImagesToVariantsResponse>
) => {
  const { images, variants } = req.validatedBody

  const uniqueImages = Array.from(new Set<string>(images))
  const uniqueVariants = Array.from(new Set<string>(variants))

  const data = uniqueImages.flatMap((imageId) =>
    uniqueVariants.map((variantId) => ({
      image_id: imageId,
      variant_id: variantId,
    }))
  )

  const productModuleService = req.scope.resolve<IProductModuleService>(
    Modules.PRODUCT
  )

  await productModuleService.addImageToVariant(data)

  const assigned = uniqueImages.map((imageId) => ({
    image_id: imageId,
    variants: uniqueVariants,
  }))

  res.status(200).json({
    assigned,
  })
}
