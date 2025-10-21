/**
 * @schema AdminCreateCalculatedShippingOption
 * type: object
 * description: SUMMARY
 * x-schemaName: AdminCreateCalculatedShippingOption
 * required:
 *   - price_type
 *   - name
 *   - service_zone_id
 *   - shipping_profile_id
 *   - provider_id
 * properties:
 *   price_type:
 *     type: string
 *     title: price_type
 *     description: The shipping option's price type.
 *   name:
 *     type: string
 *     title: name
 *     description: The shipping option's name.
 *   service_zone_id:
 *     type: string
 *     title: service_zone_id
 *     description: The shipping option's service zone id.
 *   shipping_profile_id:
 *     type: string
 *     title: shipping_profile_id
 *     description: The shipping option's shipping profile id.
 *   data:
 *     type: object
 *     description: The shipping option's data.
 *   provider_id:
 *     type: string
 *     title: provider_id
 *     description: The shipping option's provider id.
 *   type:
 *     $ref: "#/components/schemas/AdminCreateShippingOptionType"
 *   type_id:
 *     type: string
 *     title: type_id
 *     description: The shipping option's type id.
 *   rules:
 *     type: array
 *     description: The shipping option's rules.
 *     items:
 *       $ref: "#/components/schemas/AdminCreateShippingOptionRule"
 *   metadata:
 *     type: object
 *     description: The shipping option's metadata.
 * 
*/

