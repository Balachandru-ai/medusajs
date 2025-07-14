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
      const adjustmentSubtotal = adj.is_tax_inclusive
        ? MathBN.div(adjustmentAmount, MathBN.add(1, taxRate))
        : adjustmentAmount

      const adjustmentTaxTotal = MathBN.mult(adjustmentSubtotal, taxRate)
      const adjustmentTotal = MathBN.add(adjustmentSubtotal, adjustmentTaxTotal)

      adjustmentsSubtotal = MathBN.add(adjustmentsSubtotal, adjustmentSubtotal)
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
