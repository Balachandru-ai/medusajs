/**
 * @oas [post] /admin/translations/batch
 * operationId: PostTranslationsBatch
 * summary: Create Translation
 * description: Create a translation.
 * x-authenticated: true
 * parameters: []
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
 *           create:
 *             type: array
 *             description: The translation's create.
 *             items:
 *               type: object
 *               description: The create's details.
 *               required:
 *                 - reference
 *                 - reference_id
 *                 - locale_code
 *                 - translations
 *               properties:
 *                 reference:
 *                   type: string
 *                   title: reference
 *                   description: The create's reference.
 *                 reference_id:
 *                   type: string
 *                   title: reference_id
 *                   description: The create's reference id.
 *                 locale_code:
 *                   type: string
 *                   title: locale_code
 *                   description: The create's locale code.
 *                 translations:
 *                   type: object
 *                   description: The create's translations.
 *           update:
 *             type: array
 *             description: The translation's update.
 *             items:
 *               type: object
 *               description: The update's details.
 *               required:
 *                 - id
 *               properties:
 *                 id:
 *                   type: string
 *                   title: id
 *                   description: The update's ID.
 *                 reference:
 *                   type: string
 *                   title: reference
 *                   description: The update's reference.
 *                 reference_id:
 *                   type: string
 *                   title: reference_id
 *                   description: The update's reference id.
 *                 locale_code:
 *                   type: string
 *                   title: locale_code
 *                   description: The update's locale code.
 *                 translations:
 *                   type: object
 *                   description: The update's translations.
 *           delete:
 *             type: array
 *             description: The translation's delete.
 *             items:
 *               type: string
 *               title: delete
 *               description: The delete's details.
 * x-codeSamples:
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/translations/batch' \
 *       -H 'Authorization: Bearer {access_token}'
 * tags:
 *   - Translations
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminTranslationsBatchResponse"
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
 * x-workflow: batchTranslationsWorkflow
 * x-events:
 *   - name: translation.created
 *     payload: |-
 *       ```ts
 *       {
 *         id, // The ID of the translation
 *       }
 *       ```
 *     description: Emitted when translations are created.
 *     deprecated: false
 *     since: 2.13.0
 *   - name: translation.updated
 *     payload: |-
 *       ```ts
 *       {
 *         id, // The ID of the translation
 *       }
 *       ```
 *     description: Emitted when translations are updated.
 *     deprecated: false
 *     since: 2.13.0
 *   - name: translation.deleted
 *     payload: |-
 *       ```ts
 *       {
 *         id, // The ID of the translation
 *       }
 *       ```
 *     description: Emitted when translations are deleted.
 *     deprecated: false
 *     since: 2.13.0
 * 
*/

