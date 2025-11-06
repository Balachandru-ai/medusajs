import { CreateTaxLineDTO, UpdateTaxLineDTO } from "#types/tax-line"

export interface CreateLineItemTaxLineDTO extends CreateTaxLineDTO {
  item_id: string
}

export interface UpdateLineItemTaxLineDTO extends UpdateTaxLineDTO {
  item_id: string
}
