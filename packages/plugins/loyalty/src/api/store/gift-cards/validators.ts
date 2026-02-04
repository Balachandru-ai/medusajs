import { createSelectParams } from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";

export type StoreGetGiftCardsParamsType = z.infer<
  typeof StoreGetGiftCardParams
>;
export const StoreGetGiftCardParams = createSelectParams();

export type StoreRedeemGiftCardType = z.infer<typeof StoreRedeemGiftCard>;
export const StoreRedeemGiftCard = z.object({}).strict();
