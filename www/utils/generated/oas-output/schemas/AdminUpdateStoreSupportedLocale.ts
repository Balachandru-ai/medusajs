/**
 * @schema AdminUpdateStoreSupportedLocale
 * type: object
 * description: The payload to update a store's supported locale.
 * x-schemaName: AdminUpdateStoreSupportedLocale
 * required:
 *   - locale_code
 * properties:
 *   locale_code:
 *     type: string
 *     title: locale_code
 *     description: The locale's code in BCP 47 format.
 *     example: fr-FR
 *   is_default:
 *     type: boolean
 *     title: is_default
 *     description: Whether the locale should be set as the store's default locale.
 * 
*/

