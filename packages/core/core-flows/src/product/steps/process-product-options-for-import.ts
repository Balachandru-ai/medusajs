import type {
  IProductModuleService,
  ProductTypes,
  UpdateProductWorkflowInputDTO,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { deepCopy } from "@medusajs/utils"

export const processProductOptionsForImportStepId =
  "process-product-options-for-import"

export type ProcessProductOptionsForImportInput = {
  products: (Omit<UpdateProductWorkflowInputDTO, "option_ids"> & {
    options: ProductTypes.CreateProductOptionDTO[]
  })[]
}

/**
 * This step processes products with options during import:
 * 1. Creates product options
 * 2. Transforms product.options to product.option_ids
 * 3. Transforms variant options from {title: value} to {optionId: value}
 */
export const processProductOptionsForImportStep = createStep(
  processProductOptionsForImportStepId,
  async (
    data: ProcessProductOptionsForImportInput,
    { container }
  ): Promise<StepResponse<UpdateProductWorkflowInputDTO[], string[]>> => {
    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )

    const createdOptionIds: string[] = []
    const processedProducts: UpdateProductWorkflowInputDTO[] = []

    for (const product of data.products) {
      if (product.options?.length) {
        const createdOptions = await productService.createProductOptions(
          product.options
        )

        createdOptionIds.push(...createdOptions.map((opt) => opt.id))

        const optionTitleToIdMap = new Map<string, string>()
        createdOptions.forEach((option) => {
          optionTitleToIdMap.set(option.title, option.id)
        })

        // Transform product to use option_ids instead of options
        const transformedProduct: any = deepCopy(product)
        delete transformedProduct.options
        transformedProduct.option_ids = createdOptions.map((opt) => opt.id)

        processedProducts.push(transformedProduct)
      } else {
        processedProducts.push(product)
      }
    }

    return new StepResponse(processedProducts, createdOptionIds)
  },
  async (createdOptionIds, { container }) => {
    if (!createdOptionIds || createdOptionIds.length === 0) {
      return
    }

    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )

    await productService.deleteProductOptions(createdOptionIds)
  }
)
