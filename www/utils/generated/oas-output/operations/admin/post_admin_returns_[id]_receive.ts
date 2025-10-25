/**
 * @oas [post] /admin/returns/{id}/receive
 * operationId: PostReturnsIdReceive
 * summary: Start Return Receival
 * description: Start a return receival process to be later confirmed using the `/admin/returns/:id/receive/confirm` API route.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The return's ID.
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
 *         $ref: "#/components/schemas/AdminPostReceiveReturnsReqSchema"
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
 *       sdk.admin.return.initiateReceive("return_123", {
 *         internal_note: "Return received by the customer",
 *       })
 *       .then(({ return }) => {
 *         console.log(return)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/returns/{id}/receive' \
 *       -H 'Authorization: Bearer {jwt_token}' \
 *       -H 'Content-Type: application/json' \
 *       --data-raw '{
 *         "return_id": "{value}",
 *         "items": [
 *           {
 *             "id": "id_qfy3t6cU7m8O5cJ5zs",
 *             "quantity": 6429460591017984,
 *             "reason_id": "{value}",
 *             "note": "{value}"
 *           }
 *         ],
 *         "internal_note": "{value}"
 *       }'
 * tags:
 *   - Returns
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminOrderReturnResponse"
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
 * x-workflow: beginReceiveReturnWorkflow
 * x-events: []
 * 
*/

