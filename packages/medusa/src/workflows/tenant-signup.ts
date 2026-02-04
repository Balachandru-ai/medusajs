import {
  createWorkflow,
  WorkflowData,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createStoresStep, updateStoresStep } from "@medusajs/core-flows"
import { createSalesChannelsStep } from "@medusajs/core-flows"
import { createUsersStep } from "@medusajs/core-flows"

export type TenantSignupInput = {
  store_name: string
  subdomain: string
  admin_email: string
  first_name?: string
  last_name?: string
}

export const tenantSignupWorkflow = createWorkflow(
  "tenant-signup",
  (input: WorkflowData<TenantSignupInput>) => {
    // 1. Create the store
    const stores = createStoresStep([{
      name: input.store_name,
      // @ts-ignore
      subdomain: input.subdomain,
    }])

    const store = transform({ stores }, (data) => data.stores[0])

    // 2. Create default sales channel
    const salesChannels = createSalesChannelsStep([{
      name: "Default Sales Channel",
      description: "Main sales channel for " + input.store_name,
    }])

    const salesChannel = transform({ salesChannels }, (data) => data.salesChannels[0])

    // 3. Update store with default sales channel
    updateStoresStep({
      id: store.id,
      default_sales_channel_id: salesChannel.id,
    })

    // 4. Create admin user
    createUsersStep([{
      email: input.admin_email,
      first_name: input.first_name,
      last_name: input.last_name,
      // @ts-ignore
      store_id: store.id,
    }])

    return new WorkflowResponse({
      store: store,
      salesChannel: salesChannel,
    })
  }
)
