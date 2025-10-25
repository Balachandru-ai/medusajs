/**
 * @oas [get] /store/return-reasons
 * operationId: GetReturnReasons
 * summary: List Return Reasons
 * description: Retrieve a list of return reasons. The return reasons can be sorted or paginated.
 * x-authenticated: false
 * parameters:
 *   - name: x-publishable-api-key
 *     in: header
 *     description: Publishable API Key created in the Medusa Admin.
 *     required: true
 *     schema:
 *       type: string
 *       externalDocs:
 *         url: https://docs.medusajs.com/api/store#publishable-api-key
 * x-codeSamples:
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl '{backend_url}/store/return-reasons' \
 *       -H 'x-publishable-api-key: {your_publishable_api_key}'
 * tags:
 *   - Return Reasons
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           allOf:
 *             - type: object
 *               description: The paginated list of return reasons.
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
 *               description: The paginated list of return reasons.
 *               required:
 *                 - return_reasons
 *               properties:
 *                 return_reasons:
 *                   type: array
 *                   description: The list of return reasons.
 *                   items:
 *                     $ref: "#/components/schemas/StoreReturnReason"
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

