import { z } from "zod"
import { createSelectParams } from "../../utils/validators"

export type StoreGetGiftCardParamsType = z.infer<typeof StoreGetGiftCardParams>
export const StoreGetGiftCardParams = createSelectParams()
