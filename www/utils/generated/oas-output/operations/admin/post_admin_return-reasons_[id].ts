/**
 * @oas [post] /admin/return-reasons/{id}
 * operationId: PostReturnReasonsId
 * summary: Update a Return Reason
 * description: Update a return reason's details.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The return reason's ID.
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
 *         $ref: "#/components/schemas/AdminUpdateReturnReason"
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
 *       sdk.admin.returnReason.update("ret_123", {
 *         value: "refund",
 *         label: "Refund",
 *       })
 *       .then(({ return_reason }) => {
 *         console.log(return_reason)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/return-reasons/{id}' \
 *       -H 'Authorization: Bearer {jwt_token}'
 * tags:
 *   - Return Reasons
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminReturnReasonResponse"
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
 * x-workflow: updateReturnReasonsWorkflow
 * x-events: []
 * 
*/

