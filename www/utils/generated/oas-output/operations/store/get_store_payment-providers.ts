/**
 * @oas [get] /store/payment-providers
 * operationId: GetPaymentProviders
 * summary: List Payment Providers
 * description: Retrieve a list of payment providers. You must provide the `region_id` query parameter to retrieve the payment providers enabled in that region.
 * x-authenticated: false
 * externalDocs:
 *   url: https://docs.medusajs.com/v2/resources/storefront-development/checkout/payment
 *   description: "Storefront guide: How to implement payment during checkout."
 * parameters:
 *   - name: x-publishable-api-key
 *     in: header
 *     description: Publishable API Key created in the Medusa Admin.
 *     required: true
 *     schema:
 *       type: string
 *       externalDocs:
 *         url: https://docs.medusajs.com/api/store#publishable-api-key
 *   - name: region_id
 *     in: query
 *     description: Filter by a region ID to get the payment providers enabled in that region.
 *     required: true
 *     schema:
 *       type: string
 *       title: region_id
 *       description: Filter by a region ID.
 * x-codeSamples:
 *   - lang: JavaScript
 *     label: JS SDK
 *     source: |-
 *       import Medusa from "@medusajs/js-sdk"
 * 
 *       let MEDUSA_BACKEND_URL = "http://localhost:9000"
 * 
 *       if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
 *         MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
 *       }
 * 
 *       export const sdk = new Medusa({
 *         baseUrl: MEDUSA_BACKEND_URL,
 *         debug: process.env.NODE_ENV === "development",
 *         publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
 *       })
 * 
 *       sdk.store.payment.listPaymentProviders({
 *         region_id: "reg_123"
 *       })
 *       .then(({ payment_providers, count, offset, limit }) => {
 *         console.log(payment_providers)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl '{backend_url}/store/payment-providers' \
 *       -H 'x-publishable-api-key: {your_publishable_api_key}'
 * tags:
 *   - Payment Providers
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           allOf:
 *             - type: object
 *               description: The list of payment providers.
 *               required:
 *                 - limit
 *                 - offset
 *                 - count
 *               properties:
 *                 limit:
 *                   type: number
 *                   title: limit
 *                   description: The maximum number of items returned.
 *                 offset:
 *                   type: number
 *                   title: offset
 *                   description: The number of items skipped before retrieving the returned items.
 *                 count:
 *                   type: number
 *                   title: count
 *                   description: The total number of items.
 *             - type: object
 *               description: The list of payment providers.
 *               required:
 *                 - payment_providers
 *               properties:
 *                 payment_providers:
 *                   type: array
 *                   description: The list of payment providers.
 *                   items:
 *                     $ref: "#/components/schemas/StorePaymentProvider"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 * 
*/

