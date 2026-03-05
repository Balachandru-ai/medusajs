import Medusa from "@medusajs/medusa-js"

export const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://medusa:9000",
  maxRetries: 3,
  publishableApiKey:
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
    "pk_1d6851a1e90d7ab87dfdb0bcd560b86d277def8128faec3ee82e77718c08ddd2",
})
