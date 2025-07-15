import { AdjustmentLineDTO, BigNumberInput } from "@medusajs/types"
import { isDefined } from "../../common"
import { MathBN } from "../math"

export function calculateAdjustmentTotal({
  adjustments,
  taxRate,
}: {
  adjustments: Pick<AdjustmentLineDTO, "amount" | "is_tax_inclusive">[]
  taxRate?: BigNumberInput
}) {
  // the sum of all adjustment amounts excluding tax
  let adjustmentsSubtotal = MathBN.convert(0)
  // the sum of all adjustment amounts including tax
  let adjustmentsTotal = MathBN.convert(0)
  // the sum of all taxes on subtotals
  let adjustmentsTaxTotal = MathBN.convert(0)

  for (const adj of adjustments) {
    if (!isDefined(adj.amount)) {
      continue
    }

    const adjustmentAmount = MathBN.convert(adj.amount)

    if (isDefined(taxRate)) {
      const adjustmentTaxTotal = MathBN.mult(adjustmentAmount, taxRate)
      const adjustmentTotal = MathBN.add(adjustmentAmount, adjustmentTaxTotal)

      adjustmentsSubtotal = MathBN.add(adjustmentsSubtotal, adjustmentAmount)
      adjustmentsTaxTotal = MathBN.add(adjustmentsTaxTotal, adjustmentTaxTotal)
      adjustmentsTotal = MathBN.add(adjustmentsTotal, adjustmentTotal)
    } else {
      adjustmentsSubtotal = MathBN.add(adjustmentsSubtotal, adjustmentAmount)
      adjustmentsTotal = MathBN.add(adjustmentsTotal, adjustmentAmount)
    }
  }

  return {
    adjustmentsTotal,
    adjustmentsSubtotal,
    adjustmentsTaxTotal,
  }
}
