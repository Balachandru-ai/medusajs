import { HttpTypes, SelectParams } from "@medusajs/types"

import { Client } from "../client"
import { ClientHeaders } from "../types"

export class Views {
  constructor(private client: Client) {}

  // Generic method to get columns for any entity
  async columns(
    entity: string,
    query?: SelectParams,
    headers?: ClientHeaders
  ): Promise<HttpTypes.AdminViewsEntityColumnsResponse> {
    return await this.client.fetch(`/admin/views/${entity}/columns`, {
      method: "GET",
      headers,
      query,
    })
  }

  // View configurations
  async listConfigurations(
    entity: string,
    query?: HttpTypes.AdminGetViewConfigurationsParams,
    headers?: ClientHeaders
  ): Promise<HttpTypes.AdminViewConfigurationListResponse> {
    return await this.client.fetch(`/admin/views/${entity}/configurations`, {
      method: "GET",
      headers,
      query,
    })
  }

  async createConfiguration(
    entity: string,
    body: HttpTypes.AdminCreateViewConfiguration,
    headers?: ClientHeaders
  ): Promise<HttpTypes.AdminViewConfigurationResponse> {
    return await this.client.fetch(`/admin/views/${entity}/configurations`, {
      method: "POST",
      headers,
      body,
    })
  }

  async retrieveConfiguration(
    entity: string,
    id: string,
    query?: SelectParams,
    headers?: ClientHeaders
  ): Promise<HttpTypes.AdminViewConfigurationResponse> {
    return await this.client.fetch(
      `/admin/views/${entity}/configurations/${id}`,
      {
        method: "GET",
        headers,
        query,
      }
    )
  }

  async updateConfiguration(
    entity: string,
    id: string,
    body: HttpTypes.AdminUpdateViewConfiguration,
    headers?: ClientHeaders
  ): Promise<HttpTypes.AdminViewConfigurationResponse> {
    return await this.client.fetch(
      `/admin/views/${entity}/configurations/${id}`,
      {
        method: "POST",
        headers,
        body,
      }
    )
  }

  async deleteConfiguration(
    entity: string,
    id: string,
    headers?: ClientHeaders
  ): Promise<HttpTypes.AdminViewConfigurationDeleteResponse> {
    return await this.client.fetch(
      `/admin/views/${entity}/configurations/${id}`,
      {
        method: "DELETE",
        headers,
      }
    )
  }

  async retrieveActiveConfiguration(
    entity: string,
    headers?: ClientHeaders
  ): Promise<
    HttpTypes.AdminViewConfigurationResponse & {
      active_view_configuration_id?: string | null
    }
  > {
    return await this.client.fetch(
      `/admin/views/${entity}/configurations/active`,
      {
        method: "GET",
        headers,
      }
    )
  }

  async setActiveConfiguration(
    entity: string,
    body: { view_configuration_id: string | null },
    headers?: ClientHeaders
  ): Promise<{ success: boolean }> {
    return await this.client.fetch(
      `/admin/views/${entity}/configurations/active`,
      {
        method: "POST",
        headers,
        body,
      }
    )
  }
}
