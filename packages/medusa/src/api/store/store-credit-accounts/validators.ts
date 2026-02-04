import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
} from "../../utils/validators"

export type StoreGetStoreCreditAccountParamsType = z.infer<
  typeof StoreGetStoreCreditAccountParams
>
export const StoreGetStoreCreditAccountParams = z.object({})

export type StoreClaimStoreCreditAccountParamsType = z.infer<
  typeof StoreClaimStoreCreditAccountParams
>
export const StoreClaimStoreCreditAccountParams = z.object({
  code: z.string(),
})

export type StoreGetStoreCreditAccountsParamsType = z.infer<
  typeof StoreGetStoreCreditAccountsParams
>
export const StoreGetStoreCreditAccountsParams = createFindParams({
  limit: 15,
  offset: 0,
})
  .merge(
    z.object({
      currency_code: z.string().optional(),
      created_at: createOperatorMap().optional(),
      updated_at: createOperatorMap().optional(),
    })
  )
  .strict()
