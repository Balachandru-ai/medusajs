/**
 * @oas [get] /admin/fulfillment-providers
 * operationId: GetFulfillmentProviders
 * summary: List Fulfillment Providers
 * description: Retrieve a list of fulfillment providers. The fulfillment providers can be filtered by fields such as `id`. The fulfillment providers can also be sorted or paginated.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: query
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: id
 *           description: Filter by a fulfillment provider's ID.
 *         - type: array
 *           description: Filter by fulfillment provider IDs.
 *           items:
 *             type: string
 *             title: id
 *             description: A fulfillment provider ID.
 *   - name: is_enabled
 *     in: query
 *     description: Filter by whether the fulfillment provider is enabled.
 *     required: false
 *     schema:
 *       type: boolean
 *       title: is_enabled
 *       description: Filter by whether the fulfillment provider is enabled.
 *   - name: q
 *     in: query
 *     description: Search term to filter a fulfillment provider's searchable properties.
 *     required: false
 *     schema:
 *       type: string
 *       title: q
 *       description: Search term to filter a fulfillment provider's searchable properties.
 *   - name: stock_location_id
 *     in: query
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: stock_location_id
 *           description: Filter by associated stock location's ID.
 *         - type: array
 *           description: Filter by associated stock location IDs.
 *           items:
 *             type: string
 *             title: stock_location_id
 *             description: A stock location's ID.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
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
 *       sdk.admin.fulfillmentProvider.list()
 *       .then(({ fulfillment_providers, count, limit, offset }) => {
 *         console.log(fulfillment_providers)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl '{backend_url}/admin/fulfillment-providers' \
 *       -H 'Authorization: Bearer {jwt_token}'
 * tags:
 *   - Fulfillment Providers
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminFulfillmentProviderListResponse"
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

