/**
 * @oas [post] /admin/product-categories
 * operationId: PostProductCategories
 * summary: Create Product Category
 * description: Create a product category.
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminCreateProductCategory"
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
 *       sdk.admin.productCategory.create({
 *         name: "Shirts"
 *       })
 *       .then(({ product_category }) => {
 *         console.log(product_category)
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/product-categories' \
 *       -H 'Authorization: Bearer {jwt_token}' \
 *       -H 'Content-Type: application/json' \
 *       --data-raw '{
 *         "name": "Vesta",
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
 * x-workflow: createProductCategoriesWorkflow
 * x-events:
 *   - name: product-category.created
 *     payload: |-
 *       ```ts
 *       [{
 *         id, // The ID of the product category
 *       }]
 *       ```
 *     description: Emitted when product categories are created.
 *     deprecated: false
 * 
*/

