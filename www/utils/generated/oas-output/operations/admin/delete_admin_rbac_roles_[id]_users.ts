/**
 * @oas [delete] /admin/rbac/roles/{id}/users
 * operationId: DeleteRbacRolesIdUsers
 * summary: Remove User from Rbac
 * description: Remove a User from a rbac.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The rbac's ID.
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
 *         $ref: "#/components/schemas/AdminRemoveRoleUsers"
 * x-codeSamples:
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X DELETE '{backend_url}/admin/rbac/roles/{id}/users' \
 *       -H 'Authorization: Bearer {access_token}' \
 *       -H 'Content-Type: application/json' \
 *       --data-raw '{
 *         "users": [
 *           "{value}"
 *         ]
 *       }'
 * tags:
 *   - Rbac
 * responses:
 *   "200":
 *     description: OK
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
 * x-workflow: removeUserRolesWorkflow
 * x-events: []
 * 
*/

