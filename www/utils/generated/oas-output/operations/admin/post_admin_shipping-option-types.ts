/**
 * @oas [post] /admin/shipping-option-types
 * operationId: PostShippingOptionTypes
 * summary: Create Shipping Option Type
 * description: Create a shipping option type.
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminCreateShippingOptionType"
 * x-codeSamples:
 *   - lang: JavaScript
 *     label: JS SDK
 *     source: |-
 *       import Medusa from "@medusajs/js-sdk"
 * 
 *       export const sdk = new Medusa({
 *         baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
 *         debug: import.meta.env.DEV,
 *         auth: {
 *           type: "session",
 *         },
 *       })
 * 
 *       sdk.admin.shippingOptionType.create({
 *         label: "Standard",
 *         code: "standard",
 *         description: "Ship in 2-3 days."
 *       })
 *       .then(({ shipping_option_type }) => {
 *         console.log(shipping_option_type)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/shipping-option-types' \
 *       -H 'Authorization: Bearer {jwt_token}' \
 *       -H 'Content-Type: application/json' \
 *       --data-raw '{
 *         "label": "{value}",
 *         "code": "{value}"
 *       }'
 * tags:
 *   - Shipping Option Types
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminShippingOptionTypeResponse"
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
 * x-workflow: createShippingOptionTypesWorkflow
 * x-events:
 *   - name: shipping-option-type.created
 *     payload: |-
 *       ```ts
 *       [{
 *         id, // The ID of the shipping option type
 *       }]
 *       ```
 *     description: Emitted when shipping option types are created.
 *     deprecated: false
 *     since: 2.10.0
 * x-since: 2.10.0
 * 
*/

