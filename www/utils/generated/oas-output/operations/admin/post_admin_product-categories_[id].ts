/**
 * @oas [post] /admin/product-categories/{id}
 * operationId: PostProductCategoriesId
 * summary: Update a Product Category
 * description: Update a product category's details.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The product category's ID.
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
 *         $ref: "#/components/schemas/AdminUpdateProductCategory"
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
 *       sdk.admin.productCategory.update("pcat_123", {
 *         name: "Shirts"
 *       })
 *       .then(({ product_category }) => {
 *         console.log(product_category)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/product-categories/{id}' \
 *       -H 'Authorization: Bearer {jwt_token}' \
 *       -H 'Content-Type: application/json' \
 *       --data-raw '{
 *         "parent_category_id": "{value}",
 *         "metadata": {}
 *       }'
 * tags:
 *   - Product Categories
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminProductCategoryResponse"
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
 * x-workflow: updateProductCategoriesWorkflow
 * x-events:
 *   - name: product-category.updated
 *     payload: |-
 *       ```ts
 *       [{
 *         id, // The ID of the product category
 *       }]
 *       ```
 *     description: Emitted when product categories are updated.
 *     deprecated: false
 * 
*/

