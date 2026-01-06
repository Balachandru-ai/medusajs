export type AdminUser = {
  id: string
  email: string
}

export type AdminAuthResponse = {
  user: AdminUser
}

export type AdminProductsListResponse = {
  products: {
    id: string
    title: string
    status: string
  }[]
}

