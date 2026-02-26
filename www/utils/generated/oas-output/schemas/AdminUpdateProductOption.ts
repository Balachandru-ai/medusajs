/**
 * @schema AdminUpdateProductOption
 * type: object
 * description: The details to update in a product option.
 * x-schemaName: AdminUpdateProductOption
 * properties:
 *   title:
 *     type: string
 *     title: title
 *     description: The option's title.
 *   values:
 *     type: array
 *     description: The option's values.
 *     items:
 *       type: string
 *       title: values
 *       description: An option value.
 *   ranks:
 *     type: object
 *     description: Key-value pairs where the key is the option value ID and the value is the rank to set for that option value.
 *     example:
 *       Small: 1
 *       Medium: 2
 *       Large: 3
 *   is_exclusive:
 *     type: boolean
 *     title: is_exclusive
 *     description: Whether the option is exclusive to a product.
 *   metadata:
 *     type: object
 *     description: Key-value pairs to hold additional information about the option.
 *     externalDocs:
 *       url: https://docs.medusajs.com/api/admin#manage-metadata
 * 
*/

