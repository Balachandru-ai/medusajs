/**
 * @oas [post] /admin/customer-groups/{id}/customers
 * operationId: PostCustomerGroupsIdCustomers
 * summary: Manage Customers of a Customer Group
 * x-sidebar-summary: Manage Customers
 * description: Manage the customers of a group to add or remove them from the group.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The customer group's ID.
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
 *         description: The customers to add or remove from the group.
 *         properties:
 *           add:
 *             type: array
 *             description: The customers to add to the group.
 *             items:
 *               type: string
 *               title: add
 *               description: A customer's ID.
 *           remove:
 *             type: array
 *             description: The customers to remove from the group.
 *             items:
 *               type: string
 *               title: remove
 *               description: A customer's ID.
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
 *       sdk.admin.customerGroup.batchCustomers("cusgroup_123", {
 *         add: ["cus_123"],
 *         remove: ["cus_321"]
 *       })
 *       .then(({ customer_group }) => {
 *         console.log(customer_group)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/customer-groups/{id}/customers' \
 *       -H 'Authorization: Bearer {jwt_token}'
 * tags:
 *   - Customer Groups
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminCustomerGroupResponse"
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
 * x-workflow: linkCustomersToCustomerGroupWorkflow
 * x-events: []
 * 
*/

