import { AdditionalData, CreateOrderDTO } from "@medusajs/framework/types"
import {
  MedusaError,
  PromotionActions,
  deduplicate,
  isDefined,
  isPresent,
} from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
  parallelize,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { getVariantPriceSetsStep } from "../../cart"
import { findOneOrAnyRegionStep } from "../../cart/steps/find-one-or-any-region"
import { findOrCreateCustomerStep } from "../../cart/steps/find-or-create-customer"
import { findSalesChannelStep } from "../../cart/steps/find-sales-channel"
import { validateLineItemPricesStep } from "../../cart/steps/validate-line-item-prices"
import { validateVariantPricesStep } from "../../cart/steps/validate-variant-prices"
import { requiredVariantFieldsForInventoryConfirmation } from "../../cart/utils/prepare-confirm-inventory-input"
import {
  PrepareLineItemDataInput,
  prepareLineItemData,
} from "../../cart/utils/prepare-line-item-data"
import { pricingContextResult } from "../../cart/utils/schemas"
import { confirmVariantInventoryWorkflow } from "../../cart/workflows/confirm-variant-inventory"
import { useQueryGraphStep } from "../../common"
import { refreshDraftOrderAdjustmentsWorkflow } from "../../draft-order/workflows/refresh-draft-order-adjustments"
import { createOrdersStep } from "../steps"
import { productVariantsFields } from "../utils/fields"
import { updateOrderTaxLinesWorkflow } from "./update-tax-lines"

function prepareLineItems(data) {
  const items = (data.input.items ?? []).map((item) => {
    const variant = data.variants?.find((v) => v.id === item.variant_id)

    const input: PrepareLineItemDataInput = {
      item,
      variant: variant,
      unitPrice: item.unit_price,
      isTaxInclusive:
        item.is_tax_inclusive ??
        variant?.calculated_price?.is_calculated_price_tax_inclusive,
      isCustomPrice: isDefined(item?.unit_price),
      taxLines: item.tax_lines ?? [],
      adjustments: item.adjustments ?? [],
    }

    if (variant && !isDefined(input.unitPrice)) {
      input.unitPrice = variant.calculated_price?.calculated_amount
    }

    return prepareLineItemData(input)
  })

  return items
}

function getOrderInput(data) {
  const shippingAddress = data.input.shipping_address ?? { id: undefined }
  delete shippingAddress.id

  const billingAddress = data.input.billing_address ?? { id: undefined }
  delete billingAddress.id

  const data_ = {
    ...data.input,
    shipping_address: isPresent(shippingAddress) ? shippingAddress : undefined,
    billing_address: isPresent(billingAddress) ? billingAddress : undefined,
    currency_code: data.input.currency_code ?? data.region.currency_code,
    region_id: data.region.id,
  }

  if (data.customerData.customer?.id) {
    data_.customer_id = data.customerData.customer.id
    data_.email = data.input?.email ?? data.customerData.customer.email
  }

  if (data.salesChannel?.id) {
    data_.sales_channel_id = data.salesChannel.id
  }

  return data_
}

/**
 * The data to create an order, along with custom data that's passed to the workflow's hooks.
 */
export type CreateOrderWorkflowInput = CreateOrderDTO & AdditionalData

export const createOrdersWorkflowId = "create-orders"
/**
 * This workflow creates an order. It's used by the [Create Draft Order Admin API Route](https://docs.medusajs.com/api/admin#draft-orders_postdraftorders), but
 * you can also use it to create any order.
 *
 * This workflow has a hook that allows you to perform custom actions on the created order. For example, you can pass under `additional_data` custom data that
 * allows you to create custom data models linked to the order.
 *
 * You can also use this workflow within your customizations or your own custom workflows, allowing you to wrap custom logic around creating an order. For example,
 * you can create a workflow that imports orders from an external system, then uses this workflow to create the orders in Medusa.
 *
 * @example
 * const { result } = await createOrderWorkflow(container)
 * .run({
 *   input: {
 *     region_id: "reg_123",
 *     items: [
 *       {
 *         variant_id: "variant_123",
 *         quantity: 1,
 *         title: "Shirt",
 *         unit_price: 10
 *       }
 *     ],
 *     sales_channel_id: "sc_123",
 *     status: "pending",
 *     shipping_address: {
 *       first_name: "John",
 *       last_name: "Doe",
 *       address_1: "123 Main St",
 *       city: "Los Angeles",
 *       country_code: "us",
 *       postal_code: "90001"
 *     },
 *     additional_data: {
 *       sync_oms: true
 *     }
 *   }
 * })
 *
 * @summary
 *
 * Create an order.
 *
 * @property hooks.orderCreated - This hook is executed after the order is created. You can consume this hook to perform custom actions on the created order.
 * @property hooks.setPricingContext - This hook is executed after the order is retrieved and before the line items are created. You can consume this hook to return any custom context useful for the prices retrieval of the variants to be added to the order.
 *
 * For example, assuming you have the following custom pricing rule:
 *
 * ```json
 * {
 *   "attribute": "location_id",
 *   "operator": "eq",
 *   "value": "sloc_123",
 * }
 * ```
 *
 * You can consume the `setPricingContext` hook to add the `location_id` context to the prices calculation:
 *
 * ```ts
 * import { createOrderWorkflow } from "@medusajs/medusa/core-flows";
 * import { StepResponse } from "@medusajs/workflows-sdk";
 *
 * createOrderWorkflow.hooks.setPricingContext((
 *   { variantIds, region, customerData, additional_data }, { container }
 * ) => {
 *   return new StepResponse({
 *     location_id: "sloc_123", // Special price for in-store purchases
 *   });
 * });
 * ```
 *
 * The variants' prices will now be retrieved using the context you return.
 *
 * :::note
 *
 * Learn more about prices calculation context in the [Prices Calculation](https://docs.medusajs.com/resources/commerce-modules/pricing/price-calculation) documentation.
 *
 * :::
 */
export const createOrderWorkflow = createWorkflow(
  createOrdersWorkflowId,
  (input: WorkflowData<CreateOrderWorkflowInput>) => {
    const variantIds = transform({ input }, (data) => {
      return (data.input.items ?? [])
        .map((item) => item.variant_id)
        .filter(Boolean) as string[]
    })

    const [salesChannel, region, customerData] = parallelize(
      findSalesChannelStep({
        salesChannelId: input.sales_channel_id,
      }),
      findOneOrAnyRegionStep({
        regionId: input.region_id,
      }),
      findOrCreateCustomerStep({
        customerId: input.customer_id,
        email: input.email,
      })
    )

    const setPricingContext = createHook(
      "setPricingContext",
      {
        variantIds,
        region,
        customerData,
        additional_data: input.additional_data,
      },
      {
        resultValidator: pricingContextResult,
      }
    )
    const setPricingContextResult = setPricingContext.getResult()

    const pricingContext = transform(
      { input, region, customerData, setPricingContextResult },
      (data) => {
        if (!data.region) {
          throw new MedusaError(MedusaError.Types.NOT_FOUND, "Region not found")
        }

        return {
          ...(data.setPricingContextResult ? data.setPricingContextResult : {}),
          currency_code: data.input.currency_code ?? data.region.currency_code,
          region_id: data.region.id,
          customer_id: data.customerData.customer?.id,
        }
      }
    )

    /**
     * Only fetch variants with calculated prices if needed, otherwise only fetch variants without
     * calculated prices.
     *
     * We need a variant calculated price when the item is either missing a unit price or is not
     * tax inclusive.
     */
    const { variantIdsForPriceCalculation, variantIdsWithoutCalculatedPrice } =
      transform({ input }, (data) => {
        const variantIdsForPriceCalculation: string[] = []
        const variantIdsWithoutCalculatedPrice: string[] = []

        data.input.items?.forEach((item) => {
          if (
            item.variant_id &&
            (!isDefined(item.unit_price) || !isDefined(item.is_tax_inclusive))
          ) {
            variantIdsForPriceCalculation.push(item.variant_id!)
          } else {
            variantIdsWithoutCalculatedPrice.push(item.variant_id!)
          }
        })

        return {
          variantIdsForPriceCalculation,
          variantIdsWithoutCalculatedPrice,
        }
      })

    /**
     * Fetch all variant for which we don't need to calculate the price.
     */
    const { data: variantsWithoutCalculatedPrice } = useQueryGraphStep({
      entity: "variants",
      fields: deduplicate([
        ...productVariantsFields,
        ...requiredVariantFieldsForInventoryConfirmation,
      ]),
      filters: {
        id: variantIdsWithoutCalculatedPrice,
      },
    }).config({ name: "query-variants-without-calculated-price" })

    /**
     * Fetch all variants for which we need to calculate the price.
     */
    const variantsWithCalculatedPrice = when(
      "fetch-variants-with-calculated-price",
      { variantIdsForPriceCalculation },
      ({ variantIdsForPriceCalculation }) => {
        return !!variantIdsForPriceCalculation.length
      }
    ).then(() => {
      const calculatePricesContext = transform(
        { items: input.items, variantIdsForPriceCalculation, pricingContext },
        (data) => {
          const baseContext = data.pricingContext

          return data.variantIdsForPriceCalculation
            ?.map((variant) => {
              // Since we retrieve the variant ids from the item, it is not possible to not find the item back from the variant id.
              const item = data.items?.find(
                (item) => item.variant_id === variant
              )!

              return {
                variantId: variant,
                context: {
                  ...baseContext,
                  quantity: item.quantity,
                },
              }
            })
            .filter(Boolean)
        }
      )

      const { data: variants } = useQueryGraphStep({
        entity: "variants",
        fields: deduplicate([
          ...productVariantsFields,
          ...requiredVariantFieldsForInventoryConfirmation,
        ]),
        filters: {
          id: variantIdsForPriceCalculation,
        },
      }).config({ name: "query-variants-to-calculate-prices" })

      const calculatedPriceSets = getVariantPriceSetsStep({
        data: calculatePricesContext,
      })

      const reconstructedVariants = transform(
        {
          variants,
          calculatedPriceSets,
        },
        (data) => {
          return data.variants.map((variant) => {
            variant.calculated_price = data.calculatedPriceSets[variant.id]
            return variant
          })
        }
      )

      validateVariantPricesStep({ variants: reconstructedVariants }).config({
        name: "validate-variants-with-calculated-price",
      })

      return reconstructedVariants
    })

    /**
     * Aggregate all variants without calculated price and all variants with calculated price.
     */
    const variants = transform(
      {
        variantsWithoutCalculatedPrice,
        variantsWithCalculatedPrice,
      },
      (data) => {
        return [
          ...data.variantsWithoutCalculatedPrice,
          ...(data.variantsWithCalculatedPrice ?? []),
        ]
      }
    )

    confirmVariantInventoryWorkflow.runAsStep({
      input: {
        sales_channel_id: salesChannel.id,
        variants,
        items: input.items!,
      },
    })

    const orderInput = transform(
      { input, region, customerData, salesChannel },
      getOrderInput
    )

    const lineItems = transform({ input, variants }, prepareLineItems)

    validateLineItemPricesStep({ items: lineItems })

    const orderToCreate = transform({ lineItems, orderInput }, (data) => {
      return {
        ...data.orderInput,
        items: data.lineItems,
      }
    })

    const orders = createOrdersStep([orderToCreate])
    const order = transform({ orders }, (data) => data.orders?.[0])

    const appliedPromoCodes: string[] = transform(
      input,
      (order) => order.promo_codes ?? []
    )

    /**
     * TODO: Currently need the refresh because when the order module creates the order, even though
     * the totals are calculated, the order is being queried and without the totals. There is some
     * point of discussion for improvements here down the line.
     */
    const { data: freshOrder } = useQueryGraphStep({
      entity: "orders",
      fields: [
        "shipping_address.*",
        "billing_address.*",
        "summary.*",
        "items.*",
        "credit_lines.*",
        "items.tax_lines.*",
        "items.adjustments.*",
        "shipping_methods.*",
        "shipping_methods.tax_lines.*",
        "shipping_methods.adjustments.*",
        "transactions.*",
        "currency_code",
        "items.tax_lines.*",
        "items.adjustments.*",
        "shipping_methods.tax_lines.*",
        "shipping_methods.adjustments.*",
        "total",
        "id",
      ],
      filters: {
        id: order.id,
      },
      options: {
        isList: false,
      },
    }).config({ name: "query-fresh-order" })

    parallelize(
      updateOrderTaxLinesWorkflow.runAsStep({
        input: {
          order_id: order.id,
        },
      }),
      refreshDraftOrderAdjustmentsWorkflow.runAsStep({
        input: {
          order: freshOrder,
          promo_codes: appliedPromoCodes,
          action: PromotionActions.REPLACE,
        },
      })
    )

    const orderCreated = createHook("orderCreated", {
      order: freshOrder,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(order, {
      hooks: [orderCreated, setPricingContext] as const,
    })
  }
)

/**
 * @deprecated Instead use the singular name `createOrderWorkflow`.
 */
export const createOrdersWorkflow = createOrderWorkflow
