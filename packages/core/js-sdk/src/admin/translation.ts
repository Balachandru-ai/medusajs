import { HttpTypes } from "@medusajs/types"
import { Client } from "../client"
import { ClientHeaders } from "../types"

export class Translation {
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

  // TODO: Ask Adrien/Shahed how do I know how to construct the api docs url when implementing new methods
  /**
   * This method retrieves a paginated list of translations. It sends a request to the
   * [List Translations](https://docs.medusajs.com/api/admin#translations_gettranslations)
   * API route.
   *
   * @param query - Filters and pagination configurations.
   * @param headers - Headers to pass in the request.
   * @returns The paginated list of translations.
   *
   * @example
   * To retrieve the list of translations:
   *
   * ```ts
   * sdk.admin.translation.list()
   * .then(({ translations, count, limit, offset }) => {
   *   console.log(translations)
   * })
   * ```
   *
   * To configure the pagination, pass the `limit` and `offset` query parameters.
   *
   * For example, to retrieve only 10 items and skip 10 items:
   *
   * ```ts
   * sdk.admin.translation.list({
   *   limit: 10,
   *   offset: 10
   * })
   * .then(({ translations, count, limit, offset }) => {
   *   console.log(translations)
   * })
   * ```
   *
   * Using the `fields` query parameter, you can specify the fields and relations to retrieve
   * in each translation:
   *
   * ```ts
   * sdk.admin.translation.list({
   *   fields: "id,name"
   * })
   * .then(({ translations, count, limit, offset }) => {
   *   console.log(translations)
   * })
   * ```
   *
   * Learn more about the `fields` property in the [API reference](https://docs.medusajs.com/api/store#select-fields-and-relations).
   */
  async list(
    query?: HttpTypes.AdminTranslationsListParams,
    headers?: ClientHeaders
  ) {
    return await this.client.fetch<HttpTypes.AdminTranslationsListResponse>(
      `/admin/translations`,
      {
        headers,
        query,
      }
    )
  }

  /**
   * This method manages allows bulk operations on translations. It sends a request to the
   * [Manage Translations](https://docs.medusajs.com/api/admin#translations_posttranslationsbatch)
   * API route.
   *
   * @param payload - The translations to create, update, or delete.
   * @param headers - Headers to pass in the request.
   * @returns The translations' details.
   *
   * @example
   * sdk.admin.translation.batch({
   *   create: [
   *     {
   *       entity_id: "prod_123",
   *       entity_type: "product",
   *       locale_code: "en-US",
   *       translations: { title: "Shirt" }
   *     }
   *   ],
   *   update: [
   *     {
   *       id: "trans_123",
   *       translations: { title: "Pants" }
   *     }
   *   ],
   *   delete: ["trans_321"]
   * })
   * .then(({ created, updated, deleted }) => {
   *   console.log(created, updated, deleted)
   * })
   * ```
   */
  async batch(body: HttpTypes.AdminBatchTranslations, headers?: ClientHeaders) {
    return await this.client.fetch<HttpTypes.AdminTranslationsBatchResponse>(
      `/admin/translations/batch`,
      { headers, body }
    )
  }
}
