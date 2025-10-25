/**
 * @oas [post] /admin/customers/{id}/customer-groups
 * operationId: PostCustomersIdCustomerGroups
 * x-sidebar-summary: Manage Customer Groups
 * summary: Manage Customer Groups of Customer
 * description: Manage the customer groups of a customer, adding or removing the customer from those groups.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The customer's ID.
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
 *         type: object
 *         description: SUMMARY
 *         properties:
 *           add:
 *             type: array
 *             description: The customer groups to add the customer to.
 *             items:
 *               type: string
 *               title: add
 *               description: The ID of the group to add the customer to.
 *           remove:
 *             type: array
 *             description: The customer groups to remove the customer from.
 *             items:
 *               type: string
 *               title: remove
 *               description: The ID of the group to remove the customer from.
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
 *       sdk.admin.customer.batchCustomerGroups("cus_123", {
 *         add: ["cusgroup_123"],
 *         remove: ["cusgroup_321"]
 *       })
 *       .then(({ customer }) => {
 *         console.log(customer)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/customers/{id}/customer-groups' \
 *       -H 'Authorization: Bearer {jwt_token}'
 * tags:
 *   - Customers
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminCustomerResponse"
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
 * x-workflow: linkCustomerGroupsToCustomerWorkflow
 * x-events: []
 * 
*/

