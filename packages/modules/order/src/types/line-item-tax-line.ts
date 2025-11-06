import { CreateOrderTaxLineDTO, UpdateOrderTaxLineDTO } from "#types/tax-line"

export interface CreateOrderLineItemTaxLineDTO extends CreateOrderTaxLineDTO {
  item_id: string
}

export interface UpdateOrderLineItemTaxLineDTO extends UpdateOrderTaxLineDTO {
  item_id: string
}
