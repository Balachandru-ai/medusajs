/**
 * @oas [post] /admin/api-keys/{id}/revoke
 * operationId: PostApiKeysIdRevoke
 * summary: Revoke API Key
 * description: |
 *   Revokes an API key. If the API key is a secret, it can't be used for authentication anymore. If it's publishable, it can't be used by client applications.
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
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminRevokeApiKey"
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
 *       sdk.admin.apiKey.revoke("apk_123")
 *       .then(({ api_key }) => {
 *         console.log(api_key)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/api-keys/{id}/revoke' \
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
 * x-workflow: revokeApiKeysWorkflow
 * x-events: []
 * 
*/

