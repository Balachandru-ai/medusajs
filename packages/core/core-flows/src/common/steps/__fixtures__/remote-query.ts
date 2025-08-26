export interface SimpleProduct {
  id: string
  title: string
  description: string
}

export interface FixtureEntryPoints {
  simple_product: SimpleProduct
}

declare module "@medusajs/types/dist/modules-sdk/remote-query-entry-points" {
  export interface RemoteQueryEntryPoints extends FixtureEntryPoints {}
}
