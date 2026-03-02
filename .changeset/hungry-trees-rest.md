---
"@medusajs/types": patch
"@medusajs/core-flows": patch
---

feat(types,core-flows): Allow tax providers to return metadata for cart/order storage

This change enables tax providers to return metadata alongside tax lines, which workflows automatically store on the cart or order. This is useful for tax providers that need to store calculation references (e.g., calculation_id) for later use during order completion (e.g., committing tax transactions).

**Use case**: Tax providers often perform a "calculation" during checkout that returns a calculation_id. During order completion, this calculation_id is used to "commit" the transaction with the tax service. Previously, providers had to use raw SQL to store this ID on the cart since they lacked access to the Cart module.

Changes:
- Add `TaxLinesResult` type that providers can return instead of just a tax lines array
- Update `ITaxProvider.getTaxLines` return type to accept either array or `TaxLinesResult`
- Update `getItemTaxLinesStep` to handle `TaxLinesResult` and pass `sourceMetadata` through
- Update `updateTaxLinesWorkflow` to store `sourceMetadata` on cart via `updateCartsStep`
- Update `upsertTaxLinesWorkflow` to store `sourceMetadata` on cart via `updateCartsStep`
- Update `updateOrderTaxLinesWorkflow` to store `sourceMetadata` on order via `updateOrdersStep`

Example usage in a tax provider:
```typescript
async getTaxLines(itemLines, shippingLines, context) {
  const calculation = await this.taxClient.calculate(...)

  return {
    taxLines: [...],
    sourceMetadata: {
      tax_calculation_id: calculation.id
    }
  }
}
```

The workflow automatically merges this metadata into the cart/order's metadata field.
