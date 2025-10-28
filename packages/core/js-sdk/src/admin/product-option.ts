import { Client } from "../client"
import { ClientHeaders } from "../types"
import { HttpTypes, SelectParams } from "@medusajs/types"

export class ProductOption {
  /**
   * @ignore
   */
  private client: Client
  /**
   * @ignore
   */
  constructor(client: Client) {
    this.client = client
  }

  /**
   * This method retrieves a paginated list of product options. It sends a request to the
   * List Product Options API route.
   *
   * @param queryParams - Filters and pagination configurations.
   * @param headers - Headers to pass in the request.
   * @returns The paginated list of product options.
   *
   * @example
   * To retrieve the list of product options:
   *
   * ```ts
   * sdk.admin.productOption.list()
   * .then(({ product_options, count, limit, offset }) => {
   *   console.log(product_options)
   * })
   * ```
   *
   * To configure the pagination, pass the `limit` and `offset` query parameters.
   *
   * For example, to retrieve only 10 items and skip 10 items:
   *
   * ```ts
   * sdk.admin.productOption.list({
   *   limit: 10,
   *   offset: 10
   * })
   * .then(({ product_options, count, limit, offset }) => {
   *   console.log(product_options)
   * })
   * ```
   */
  async list(
    queryParams?: HttpTypes.AdminProductOptionListParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminProductOptionListResponse>(
      `/admin/product-options`,
      {
        headers,
        query: queryParams,
      }
    )
  }

  /**
   * This method retrieves a product option by its ID. It sends a request to the
   * Get Product Option API route.
   *
   * @param id - The product option's ID.
   * @param query - Configure the fields to retrieve in the product option.
   * @param headers - Headers to pass in the request
   * @returns The product option's details.
   *
   * @example
   * To retrieve a product option by its ID:
   *
   * ```ts
   * sdk.admin.productOption.retrieve("opt_123")
   * .then(({ product_option }) => {
   *   console.log(product_option)
   * })
   * ```
   */
  async retrieve(id: string, query?: SelectParams, headers?: ClientHeaders) {
    return this.client.fetch<HttpTypes.AdminProductOptionResponse>(
      `/admin/product-options/${id}`,
      {
        query,
        headers,
      }
    )
  }

  /**
   * This method deletes a product option. It sends a request to the
   * Delete Product Option API route.
   *
   * @param id - The product option's ID.
   * @param headers - Headers to pass in the request
   * @returns The deletion's details.
   *
   * @example
   * sdk.admin.productOption.delete("opt_123")
   * .then(({ deleted }) => {
   *   console.log(deleted)
   * })
   */
  async delete(id: string, headers?: ClientHeaders) {
    return this.client.fetch<HttpTypes.AdminProductOptionDeleteResponse>(
      `/admin/product-options/${id}`,
      {
        method: "DELETE",
        headers,
      }
    )
  }
}
