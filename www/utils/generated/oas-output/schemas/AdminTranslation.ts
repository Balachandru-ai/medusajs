/**
 * @schema AdminTranslation
 * type: object
 * description: The translation's translations.
 * x-schemaName: AdminTranslation
 * required:
 *   - id
 *   - reference_id
 *   - reference
 *   - locale_code
 *   - translations
 *   - created_at
 *   - updated_at
 *   - deleted_at
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The translation's ID.
 *   reference_id:
 *     type: string
 *     title: reference_id
 *     description: The translation's reference id.
 *   reference:
 *     type: string
 *     title: reference
 *     description: The translation's reference.
 *   locale_code:
 *     type: string
 *     title: locale_code
 *     description: The translation's locale code.
 *   translations:
 *     type: object
 *     description: The translation's translations.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The translation's created at.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The translation's updated at.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The translation's deleted at.
 * 
*/

