/**
 * @oas [get] /store/regions
 * operationId: GetRegions
 * summary: List Regions
 * description: Retrieve a list of regions. The regions can be filtered by fields such as `id`. The regions can also be sorted or paginated.
 * x-authenticated: false
 * externalDocs:
 *   url: https://docs.medusajs.com/v2/resources/storefront-development/regions/list
 *   description: "Storefront guide: How to retrieve a list of regions."
 * parameters:
 *   - name: x-publishable-api-key
 *     in: header
 *     description: Publishable API Key created in the Medusa Admin.
 *     required: true
 *     schema:
 *       type: string
 *       externalDocs:
 *         url: https://docs.medusajs.com/api/store#publishable-api-key
 *   - name: q
 *     in: query
 *     description: Search term to filter the region's searchable properties.
 *     required: false
 *     schema:
 *       type: string
 *       title: q
 *       description: Search term to filter the region's searchable properties.
 *   - name: id
 *     in: query
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: id
 *           description: Filter by a region's ID.
 *         - type: array
 *           description: Filter by region IDs.
 *           items:
 *             type: string
 *             title: id
 *             description: A region's ID.
 *   - name: name
 *     in: query
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: name
 *           description: Filter by a region name.
 *         - type: array
 *           description: Filter by region names.
 *           items:
 *             type: string
 *             title: name
 *             description: A region's name.
 *   - name: currency_code
 *     in: query
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: currency_code
 *           description: Filter by a currency code to retrieve regions that use that code.
 *         - type: array
 *           description: Filter by currency codes to retrieve regions that use one of these codes.
 *           items:
 *             type: string
 *             title: currency_code
 *             description: A currency code.
 *   - name: $and
 *     in: query
 *     description: Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters.
 *     required: false
 *     schema:
 *       type: array
 *       description: Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters.
 *       items:
 *         type: object
 *       title: $and
 *   - name: $or
 *     in: query
 *     description: Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters.
 *     required: false
 *     schema:
 *       type: array
 *       description: Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters.
 *       items:
 *         type: object
 *       title: $or
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
 *       sdk.store.region.list()
 *       .then(({ regions, count, limit, offset }) => {
 *         console.log(regions)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl '{backend_url}/store/regions' \
 *       -H 'x-publishable-api-key: {your_publishable_api_key}'
 * tags:
 *   - Regions
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           allOf:
 *             - type: object
 *               description: The paginated list of regions.
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
 *               description: The paginated list of regions.
 *               required:
 *                 - regions
 *               properties:
 *                 regions:
 *                   type: array
 *                   description: The list of regions.
 *                   items:
 *                     $ref: "#/components/schemas/StoreRegion"
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

