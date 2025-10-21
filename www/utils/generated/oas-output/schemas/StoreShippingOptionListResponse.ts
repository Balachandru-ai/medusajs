/**
 * @schema StoreShippingOptionListResponse
 * type: object
 * description: The shipping option's details.
 * x-schemaName: StoreShippingOptionListResponse
 * required:
 *   - shipping_options
 * properties:
 *   shipping_options:
 *     type: array
 *     description: The shipping option's shipping options.
 *     items:
 *       allOf:
 *         - type: object
 *           description: The shipping option's shipping options.
 *           x-schemaName: StoreCartShippingOption
 *           required:
 *             - id
 *             - name
 *             - price_type
 *             - service_zone_id
 *             - shipping_profile_id
 *             - provider_id
 *             - data
 *             - type
 *             - provider
 *             - amount
 *             - prices
 *             - calculated_price
 *             - insufficient_inventory
 *           properties:
 *             id:
 *               type: string
 *               title: id
 *               description: The shipping option's ID.
 *             name:
 *               type: string
 *               title: name
 *               description: The shipping option's name.
 *             price_type:
 *               type: string
 *               description: The shipping option's price type.
 *               enum:
 *                 - flat
 *                 - calculated
 *             service_zone_id:
 *               type: string
 *               title: service_zone_id
 *               description: The shipping option's service zone id.
 *             shipping_profile_id:
 *               type: string
 *               title: shipping_profile_id
 *               description: The shipping option's shipping profile id.
 *             provider_id:
 *               type: string
 *               title: provider_id
 *               description: The shipping option's provider id.
 *             data:
 *               type: object
 *               description: The shipping option's data.
 *             type:
 *               type: object
 *               description: The shipping option's type.
 *               required:
 *                 - id
 *                 - label
 *                 - description
 *                 - code
 *               properties:
 *                 id:
 *                   type: string
 *                   title: id
 *                   description: The type's ID.
 *                 label:
 *                   type: string
 *                   title: label
 *                   description: The type's label.
 *                 description:
 *                   type: string
 *                   title: description
 *                   description: The type's description.
 *                 code:
 *                   type: string
 *                   title: code
 *                   description: The type's code.
 *             provider:
 *               type: object
 *               description: The shipping option's provider.
 *               required:
 *                 - id
 *                 - is_enabled
 *               properties:
 *                 id:
 *                   type: string
 *                   title: id
 *                   description: The provider's ID.
 *                 is_enabled:
 *                   type: boolean
 *                   title: is_enabled
 *                   description: The provider's is enabled.
 *             amount:
 *               type: number
 *               title: amount
 *               description: The shipping option's amount.
 *             prices:
 *               type: array
 *               description: The shipping option's prices.
 *               items:
 *                 type: object
 *                 description: The price's prices.
 *                 x-schemaName: StorePrice
 *                 required:
 *                   - id
 *                   - currency_code
 *                   - amount
 *                   - min_quantity
 *                   - max_quantity
 *                 properties:
 *                   id:
 *                     type: string
 *                     title: id
 *                     description: The price's ID.
 *                   currency_code:
 *                     type: string
 *                     title: currency_code
 *                     description: The price's currency code.
 *                   amount:
 *                     type: number
 *                     title: amount
 *                     description: The price's amount.
 *                   min_quantity:
 *                     type: number
 *                     title: min_quantity
 *                     description: The price's min quantity.
 *                   max_quantity:
 *                     type: number
 *                     title: max_quantity
 *                     description: The price's max quantity.
 *                   price_rules:
 *                     type: array
 *                     description: The price's price rules.
 *                     items:
 *                       type: object
 *                       description: The price rule's price rules.
 *                       x-schemaName: StorePriceRule
 *                       required:
 *                         - id
 *                         - attribute
 *                         - operator
 *                         - value
 *                       properties:
 *                         id:
 *                           type: string
 *                           title: id
 *                           description: The price rule's ID.
 *                         attribute:
 *                           type: string
 *                           title: attribute
 *                           description: The price rule's attribute.
 *                         operator:
 *                           type: string
 *                           description: The price rule's operator.
 *                           enum:
 *                             - gt
 *                             - lt
 *                             - eq
 *                             - lte
 *                             - gte
 *                         value:
 *                           type: string
 *                           title: value
 *                           description: The price rule's value.
 *             calculated_price:
 *               type: object
 *               description: The shipping option's calculated price.
 *               x-schemaName: StoreCalculatedPrice
 *               required:
 *                 - id
 *                 - calculated_amount
 *                 - original_amount
 *                 - original_amount_with_tax
 *                 - original_amount_without_tax
 *                 - currency_code
 *               properties:
 *                 id:
 *                   type: string
 *                   title: id
 *                   description: The calculated price's ID.
 *                 is_calculated_price_price_list:
 *                   type: boolean
 *                   title: is_calculated_price_price_list
 *                   description: The calculated price's is calculated price price list.
 *                 is_calculated_price_tax_inclusive:
 *                   type: boolean
 *                   title: is_calculated_price_tax_inclusive
 *                   description: The calculated price's is calculated price tax inclusive.
 *                 calculated_amount:
 *                   type: number
 *                   title: calculated_amount
 *                   description: The calculated price's calculated amount.
 *                 calculated_amount_with_tax:
 *                   type: number
 *                   title: calculated_amount_with_tax
 *                   description: The calculated price's calculated amount with tax.
 *                 calculated_amount_without_tax:
 *                   type: number
 *                   title: calculated_amount_without_tax
 *                   description: The calculated price's calculated amount without tax.
 *                 is_original_price_price_list:
 *                   type: boolean
 *                   title: is_original_price_price_list
 *                   description: The calculated price's is original price price list.
 *                 is_original_price_tax_inclusive:
 *                   type: boolean
 *                   title: is_original_price_tax_inclusive
 *                   description: The calculated price's is original price tax inclusive.
 *                 original_amount:
 *                   type: number
 *                   title: original_amount
 *                   description: The calculated price's original amount.
 *                 original_amount_with_tax:
 *                   type: number
 *                   title: original_amount_with_tax
 *                   description: The calculated price's original amount with tax.
 *                 original_amount_without_tax:
 *                   type: number
 *                   title: original_amount_without_tax
 *                   description: The calculated price's original amount without tax.
 *                 currency_code:
 *                   type: string
 *                   title: currency_code
 *                   description: The calculated price's currency code.
 *                 calculated_price:
 *                   type: object
 *                   description: The calculated price's details.
 *                   required:
 *                     - id
 *                     - price_list_id
 *                     - price_list_type
 *                     - min_quantity
 *                     - max_quantity
 *                   properties:
 *                     id:
 *                       type: string
 *                       title: id
 *                       description: The calculated price's ID.
 *                     price_list_id:
 *                       type: string
 *                       title: price_list_id
 *                       description: The calculated price's price list id.
 *                     price_list_type:
 *                       type: string
 *                       title: price_list_type
 *                       description: The calculated price's price list type.
 *                     min_quantity:
 *                       type: number
 *                       title: min_quantity
 *                       description: The calculated price's min quantity.
 *                     max_quantity:
 *                       type: number
 *                       title: max_quantity
 *                       description: The calculated price's max quantity.
 *                 original_price:
 *                   type: object
 *                   description: The calculated price's original price.
 *                   required:
 *                     - id
 *                     - price_list_id
 *                     - price_list_type
 *                     - min_quantity
 *                     - max_quantity
 *                   properties:
 *                     id:
 *                       type: string
 *                       title: id
 *                       description: The original price's ID.
 *                     price_list_id:
 *                       type: string
 *                       title: price_list_id
 *                       description: The original price's price list id.
 *                     price_list_type:
 *                       type: string
 *                       title: price_list_type
 *                       description: The original price's price list type.
 *                     min_quantity:
 *                       type: number
 *                       title: min_quantity
 *                       description: The original price's min quantity.
 *                     max_quantity:
 *                       type: number
 *                       title: max_quantity
 *                       description: The original price's max quantity.
 *             insufficient_inventory:
 *               type: boolean
 *               title: insufficient_inventory
 *               description: The shipping option's insufficient inventory.
 *         - type: object
 *           description: The shipping option's shipping options.
 *           required:
 *             - service_zone
 *           properties:
 *             service_zone:
 *               type: object
 *               description: The shipping option's service zone.
 *               required:
 *                 - id
 *                 - fulfillment_set_id
 *                 - fulfillment_set
 *               properties:
 *                 id:
 *                   type: string
 *                   title: id
 *                   description: The service zone's ID.
 *                 fulfillment_set_id:
 *                   type: string
 *                   title: fulfillment_set_id
 *                   description: The service zone's fulfillment set id.
 *                 fulfillment_set:
 *                   type: object
 *                   description: The service zone's fulfillment set.
 *                   required:
 *                     - id
 *                     - type
 *                     - location
 *                   properties:
 *                     id:
 *                       type: string
 *                       title: id
 *                       description: The fulfillment set's ID.
 *                     type:
 *                       type: string
 *                       title: type
 *                       description: The fulfillment set's type.
 *                     location:
 *                       type: object
 *                       description: The fulfillment set's location.
 *                       required:
 *                         - id
 *                         - address
 *                       properties:
 *                         id:
 *                           type: string
 *                           title: id
 *                           description: The location's ID.
 *                         address:
 *                           type: object
 *                           description: The location's address.
 *                           x-schemaName: StoreFulfillmentAddress
 *                           required:
 *                             - id
 *                             - company
 *                             - address_1
 *                             - address_2
 *                             - city
 *                             - country_code
 *                             - province
 *                             - postal_code
 *                             - phone
 *                             - metadata
 *                             - created_at
 *                             - updated_at
 *                             - deleted_at
 *                           properties:
 *                             id:
 *                               type: string
 *                               title: id
 *                               description: The address's ID.
 *                             company:
 *                               type: string
 *                               title: company
 *                               description: The address's company.
 *                             address_1:
 *                               type: string
 *                               title: address_1
 *                               description: The address's address 1.
 *                             address_2:
 *                               type: string
 *                               title: address_2
 *                               description: The address's address 2.
 *                             city:
 *                               type: string
 *                               title: city
 *                               description: The address's city.
 *                             country_code:
 *                               type: string
 *                               title: country_code
 *                               description: The address's country code.
 *                             province:
 *                               type: string
 *                               title: province
 *                               description: The address's province.
 *                             postal_code:
 *                               type: string
 *                               title: postal_code
 *                               description: The address's postal code.
 *                             phone:
 *                               type: string
 *                               title: phone
 *                               description: The address's phone.
 *                             metadata:
 *                               type: object
 *                               description: The address's metadata.
 *                             created_at:
 *                               type: string
 *                               format: date-time
 *                               title: created_at
 *                               description: The address's created at.
 *                             updated_at:
 *                               type: string
 *                               format: date-time
 *                               title: updated_at
 *                               description: The address's updated at.
 *                             deleted_at:
 *                               type: string
 *                               format: date-time
 *                               title: deleted_at
 *                               description: The address's deleted at.
 *       description: The shipping option's details.
 * 
*/

