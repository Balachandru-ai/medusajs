import Medusa from "@medusajs/js-sdk"

export const medusa = new Medusa({
  baseUrl: import.meta.env.VITE_MEDUSA_BACKEND_URL,
})



