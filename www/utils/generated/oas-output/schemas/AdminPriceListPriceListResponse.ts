/**
 * @schema AdminPriceListPriceListResponse
 * type: object
 * description: SUMMARY
 * x-schemaName: AdminPriceListPriceListResponse
 * required:
 *   - limit
 *   - offset
 *   - count
 *   - prices
 * properties:
 *   limit:
 *     type: number
 *     title: limit
 *     description: The price list's limit.
 *   offset:
 *     type: number
 *     title: offset
 *     description: The price list's offset.
 *   count:
 *     type: number
 *     title: count
 *     description: The price list's count.
 *   estimate_count:
 *     type: number
 *     title: estimate_count
 *     description: The price list's estimate count.
 *     x-featureFlag: index_engine
 *   prices:
 *     type: array
 *     description: The price list's prices.
 *     items:
 *       $ref: "#/components/schemas/AdminPrice"
 * 
*/

