/**
 * @oas [post] /admin/rbac/policies/{id}
 * operationId: PostRbacPoliciesId
 * summary: Add Policy to Rbac
 * description: Add a Policy to a rbac
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
 *         $ref: "#/components/schemas/AdminUpdateRbacPolicy"
 * x-codeSamples:
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/rbac/policies/{id}' \
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
 * x-workflow: updateRbacPoliciesWorkflow
 * x-events: []
 * 
*/

