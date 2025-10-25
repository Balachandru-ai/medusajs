/**
 * @oas [get] /admin/api-keys/{id}
 * operationId: GetApiKeysId
 * summary: Get API Key
 * description: Retrieve an API key by its ID. You can expand the API key's relations or select the fields that should be returned using the query parameters.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The API key's ID.
 *     required: true
 *     schema:
 *       type: string
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
 *       sdk.admin.apiKey.retrieve("apk_123")
 *       .then(({ api_key }) => {
 *         console.log(api_key)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl '{backend_url}/admin/api-keys/{id}' \
 *       -H 'Authorization: Bearer {jwt_token}'
 * tags:
 *   - Api Keys
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminApiKeyResponse"
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

