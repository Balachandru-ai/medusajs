import { z } from "zod"

export const addressSchema = z.object({
  country_code: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  address_1: z.string().min(1),
  address_2: z.string().optional(),
  company: z.string().optional(),
  city: z.string().min(1),
  province: z.string().optional(),
  postal_code: z.string().min(1),
  phone: z.string().optional(),
})
