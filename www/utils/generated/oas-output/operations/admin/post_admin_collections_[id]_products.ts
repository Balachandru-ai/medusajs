/**
 * @oas [post] /admin/collections/{id}/products
 * operationId: PostCollectionsIdProducts
 * summary: Manage Products of a Collection
 * x-sidebar-summary: Manage Products
 * description: Manage the products of a collection by adding or removing them from the collection.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The collection's ID.
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
 *         description: The products to add or remove.
 *         properties:
 *           add:
 *             type: array
 *             description: The products to add to the collection.
 *             items:
 *               type: string
 *               title: add
 *               description: A product's ID.
 *           remove:
 *             type: array
 *             description: The products to remove from the collection.
 *             items:
 *               type: string
 *               title: remove
 *               description: A product's ID.
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
 *       sdk.admin.productCollection.updateProducts("pcol_123", {
 *         add: ["prod_123"],
 *         remove: ["prod_321"]
 *       })
 *       .then(({ collection }) => {
 *         console.log(collection)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/collections/{id}/products' \
 *       -H 'Authorization: Bearer {jwt_token}'
 * tags:
 *   - Collections
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminCollectionResponse"
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
 * x-workflow: batchLinkProductsToCollectionWorkflow
 * x-events: []
 * 
*/

