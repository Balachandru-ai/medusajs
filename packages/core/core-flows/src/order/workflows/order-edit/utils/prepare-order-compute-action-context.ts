import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type {
  ComputeActionContext,
  OrderDTO,
  OrderLineItemDTO,
  OrderPreviewDTO,
  OrderShippingMethodDTO,
  ProductDTO,
  ShippingOptionDTO,
} from "@medusajs/framework/types"

/**
 * The details of the order to prepare compute actions for.
 */
export interface PrepareOrderComputeActionContextStepInput {
  /**
   * The order.
   */
  order: OrderDTO
  /**
   * The previewed order after applying the order change.
   */
  previewedOrder: OrderPreviewDTO
}

type ProductContextDTO = Pick<
  ProductDTO,
  "id" | "collection_id" | "tags" | "categories" | "type_id"
>

type ComputeActionItem = NonNullable<ComputeActionContext["items"]>[number]
type ComputeActionProductContext = NonNullable<ComputeActionItem["product"]>
type ComputeActionAdjustmentLine = NonNullable<
  ComputeActionItem["adjustments"]
>[number]
type ComputeActionShippingOption = NonNullable<
  NonNullable<
    ComputeActionContext["shipping_methods"]
  >[number]["shipping_option"]
>

type ShippingOptionContextDTO = Pick<
  ShippingOptionDTO,
  "id" | "shipping_option_type_id"
>

type OrderItemWithContext = OrderLineItemDTO & {
  product?: ProductContextDTO
}

type OrderShippingMethodWithContext = OrderShippingMethodDTO & {
  shipping_option?: ComputeActionShippingOption
}

type QueryGraphResult<T> = {
  data?: T[]
}

const normalizeProductContext = (
  product?: ProductContextDTO | { id: string }
): ComputeActionProductContext | undefined => {
  if (!product) {
    return undefined
  }

  const productData = product as Partial<ProductContextDTO>

  return {
    id: product.id,
    collection_id: productData.collection_id ?? undefined,
    tags: productData.tags ?? undefined,
    categories: productData.categories ?? undefined,
    type_id: productData.type_id ?? undefined,
  }
}

export const prepareOrderComputeActionContextStepId =
  "prepare-order-compute-action-context"

/**
 * This step prepares the compute action context for an order by enriching
 * previewed items and shipping methods with external entities.
 *
 * Order `preview` doesn't return related entities from external modules
 * and order itself could have stale entitites depending on the change action
 * so we need to prepare some data "manually" to make sure the compute action context is correct
 */
export const prepareOrderComputeActionContextStep = createStep(
  prepareOrderComputeActionContextStepId,
  async (
    { order, previewedOrder }: PrepareOrderComputeActionContextStepInput,
    { container }
  ): Promise<StepResponse<ComputeActionContext>> => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const productIds = [
      ...new Set(
        (previewedOrder.items ?? order.items ?? [])
          .map((item) => item.product_id)
          .filter((id): id is string => !!id)
      ),
    ]
    const shippingOptionIds = [
      ...new Set(
        (previewedOrder.shipping_methods ?? order.shipping_methods ?? [])
          .map((method) => method.shipping_option_id)
          .filter((id): id is string => !!id)
      ),
    ]

    const productsPromise: Promise<QueryGraphResult<ProductContextDTO>> =
      productIds.length
        ? query.graph({
          entity: "product",
          fields: [
            "id",
            "collection_id",
            "tags.id",
            "categories.id",
            "type_id",
          ],
          filters: { id: productIds },
        })
        : Promise.resolve({ data: [] })
    const shippingOptionsPromise: Promise<
      QueryGraphResult<ShippingOptionContextDTO>
    > = shippingOptionIds.length
        ? query.graph({
          entity: "shipping_option",
          fields: ["id", "shipping_option_type_id"],
          filters: { id: shippingOptionIds },
        })
        : Promise.resolve({ data: [] })

    const [productsResult, shippingOptionsResult] = await Promise.all([
      productsPromise,
      shippingOptionsPromise,
    ])

    const products = productsResult.data ?? []
    const shippingOptions = shippingOptionsResult.data ?? []

    const productMap = new Map<string, ProductContextDTO>(
      products.map((product) => [product.id, product])
    )
    const shippingOptionMap = new Map<string, ShippingOptionContextDTO>(
      shippingOptions.map((option) => [option.id, option])
    )

    const itemsSource = (previewedOrder.items ??
      order.items ??
      []) as OrderItemWithContext[]
    const items = itemsSource.map((item) => {
      const product = normalizeProductContext(
        item.product ??
        (item.product_id ? productMap.get(item.product_id) : undefined)
      )
      const rawAdjustments = item.adjustments ?? []
      const adjustments = rawAdjustments
        .filter((adjustment) => !!adjustment?.code && adjustment?.id)
        .map((adjustment) => ({
          id: adjustment.id,
          code: adjustment.code,
        })) as ComputeActionAdjustmentLine[]

      return {
        ...item,
        id: item.id,
        quantity: item.quantity,
        subtotal: item.subtotal,
        original_total: item.original_total,
        is_discountable: item.is_discountable,
        adjustments: adjustments.length ? adjustments : undefined,
        product:
          product ?? (item.product_id ? { id: item.product_id } : undefined),
      }
    })

    const shippingMethodsSource = (previewedOrder.shipping_methods ??
      order.shipping_methods ??
      []) as OrderShippingMethodWithContext[]
    const shipping_methods = shippingMethodsSource.map((method) => {
      const shippingOption = method.shipping_option_id
        ? shippingOptionMap.get(method.shipping_option_id)
        : undefined
      const rawAdjustments = method.adjustments ?? []

      const adjustments = rawAdjustments
        .filter((adjustment) => !!adjustment?.code && adjustment?.id)
        .map((adjustment) => ({
          id: adjustment.id,
          code: adjustment.code,
        })) as ComputeActionAdjustmentLine[]
      const shippingOptionTypeId =
        method.shipping_option?.shipping_option_type_id ??
        shippingOption?.shipping_option_type_id

      return {
        ...method,
        id: method.id,
        subtotal: method.subtotal,
        original_total: method.original_total,
        adjustments: adjustments.length ? adjustments : undefined,
        shipping_option: shippingOptionTypeId
          ? { shipping_option_type_id: shippingOptionTypeId }
          : undefined,
      }
    })

    const previewCustomer = (
      previewedOrder as {
        customer?: ComputeActionContext["customer"]
      }
    ).customer
    const orderCustomer = (
      order as {
        customer?: ComputeActionContext["customer"]
      }
    ).customer
    const customerContext =
      previewCustomer?.id || orderCustomer?.id || order.customer_id
        ? {
          id: previewCustomer?.id ?? orderCustomer?.id ?? order.customer_id!,
          groups: (previewCustomer?.groups ?? orderCustomer?.groups)?.map(
            (group) => ({
              id: group.id,
            })
          ),
        }
        : undefined

    const previewRegion = (
      previewedOrder as {
        region?: ComputeActionContext["region"]
      }
    ).region
    const orderRegion = (
      order as {
        region?: ComputeActionContext["region"]
      }
    ).region
    const regionContext =
      previewRegion?.id || orderRegion?.id || order.region_id
        ? {
          id: previewRegion?.id ?? orderRegion?.id ?? order.region_id!,
        }
        : undefined

    const shippingAddress =
      (
        previewedOrder as {
          shipping_address?: ComputeActionContext["shipping_address"]
        }
      ).shipping_address ??
      (
        order as {
          shipping_address?: ComputeActionContext["shipping_address"]
        }
      ).shipping_address
    const shippingAddressContext = shippingAddress?.country_code
      ? { country_code: shippingAddress.country_code }
      : undefined

    const computeActionContext: ComputeActionContext = {
      currency_code: previewedOrder.currency_code ?? order.currency_code,
      customer: customerContext,
      region: regionContext,
      shipping_address: shippingAddressContext,
      sales_channel_id:
        previewedOrder.sales_channel_id ?? order.sales_channel_id,
      email: previewedOrder.email ?? order.email,
      items,
      shipping_methods,
    }

    return new StepResponse(computeActionContext)
  }
)
