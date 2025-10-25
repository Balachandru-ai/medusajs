/**
 * @oas [post] /admin/products/export
 * operationId: PostProductsExport
 * summary: Export Products
 * description: >
 *   Start a product export process to retrieve a CSV of exported products.
 * 
 * 
 *   You'll receive in the response the transaction ID of the workflow generating the CSV file. To check the status of the execution, send a GET request to `/admin/workflows-executions/export-products/:transaction-id`.
 * 
 *   Once the execution finishes successfully, a notification is created for the export. You can retrieve the notifications using the `/admin/notification` API route to retrieve the file's download URL.
 * x-authenticated: true
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
 *       sdk.admin.product.export({})
 *       .then(({ transaction_id }) => {
 *         console.log(transaction_id)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/products/export' \
 *       -H 'Authorization: Bearer {jwt_token}'
 * tags:
 *   - Products
 * responses:
 *   "202":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminExportProductResponse"
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
 * x-workflow: exportProductsWorkflow
 * x-events: []
 * 
*/

