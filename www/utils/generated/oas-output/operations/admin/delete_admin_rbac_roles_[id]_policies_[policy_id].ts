/**
 * @oas [delete] /admin/rbac/roles/{id}/policies/{policy_id}
 * operationId: DeleteRbacRolesIdPoliciesPolicy_id
 * summary: Remove Policy from Rbac
 * description: Remove a Policy from a rbac.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The rbac's ID.
 *     required: true
 *     schema:
 *       type: string
 *   - name: policy_id
 *     in: path
 *     description: The rbac's policy id.
 *     required: true
 *     schema:
 *       type: string
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 * x-codeSamples:
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X DELETE '{backend_url}/admin/rbac/roles/{id}/policies/{policy_id}' \
 *       -H 'Authorization: Bearer {access_token}'
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
 * x-workflow: deleteRbacRolePoliciesWorkflow
 * x-events: []
 * 
*/

