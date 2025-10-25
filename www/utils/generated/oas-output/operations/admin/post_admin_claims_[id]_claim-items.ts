/**
 * @oas [post] /admin/claims/{id}/claim-items
 * operationId: PostClaimsIdClaimItems
 * summary: Add Claim Items to a Claim
 * x-sidebar-summary: Add Claim Items
 * description: Add order items to a claim as claim items. These claim items will have the action `WRITE_OFF_ITEM`.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The claim's ID.
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
 *         $ref: "#/components/schemas/AdminPostClaimItemsReqSchema"
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
 *       sdk.admin.claim.addItems("claim_123", {
 *         items: [
 *           {
 *             id: "orli_123",
 *             quantity: 1
 *           }
 *         ]
 *       })
 *       .then(({ claim }) => {
 *         console.log(claim)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/claims/{id}/claim-items' \
 *       -H 'Authorization: Bearer {jwt_token}'
 * tags:
 *   - Claims
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminClaimPreviewResponse"
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
 * x-workflow: orderClaimItemWorkflow
 * x-events: []
 * 
*/

