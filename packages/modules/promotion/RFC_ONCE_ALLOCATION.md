# ONCE Allocation Strategy for Promotions

## Summary
Add a new `once` allocation strategy to promotions that limits application to a maximum number of items across the entire cart, rather than per line item.

## Motivation
Merchants want to create promotions that apply to a limited number of items across the entire cart. For example:
- "Get $10 off, applied to one item only"
- "20% off up to 2 items in your cart"

Current allocation strategies:
- `each`: Applies to each line item independently (respects `max_quantity` per item)
- `across`: Distributes proportionally across all items

Neither supports limiting total applications across the entire cart.

## Proposed Solution

### New Allocation Type: `once`
Add `once` to the `ApplicationMethodAllocation` enum.

**Behavior:**
- Applies promotion to maximum `max_quantity` items across entire cart
- Always prioritizes lowest-priced eligible items first
- Distributes sequentially across items until quota exhausted
- Requires `max_quantity` field to be set

### Example Usage

**Scenario 1: Fixed discount**
```javascript
{
  type: "fixed",
  allocation: "once",
  value: 10,        // $10 off
  max_quantity: 2   // Apply to 2 items max across cart
}

Cart:
- Item A: 3 units @ $100/unit
- Item B: 5 units @ $50/unit (lowest price)

Result: $20 discount on Item B (2 units × $10)
```

**Scenario 2: Distribution across items**
```javascript
{
  type: "fixed",
  allocation: "once",
  value: 5,
  max_quantity: 4
}

Cart:
- Item A: 2 units @ $50/unit
- Item B: 3 units @ $60/unit

Result:
- Item A: $10 discount (2 units × $5)
- Item B: $10 discount (2 units × $5, remaining quota)
```

**Scenario 3: Percentage discount - single item**
```javascript
{
  type: "percentage",
  allocation: "once",
  value: 20,         // 20% off
  max_quantity: 3    // Apply to 3 items max
}

Cart:
- Item A: 5 units @ $100/unit
- Item B: 4 units @ $50/unit (lowest price)

Result: $30 discount on Item B (3 units × $50 × 20% = $30)
```

**Scenario 4: Percentage discount - distributed across items**
```javascript
{
  type: "percentage",
  allocation: "once",
  value: 15,         // 15% off
  max_quantity: 5
}

Cart:
- Item A: 2 units @ $40/unit (lowest price)
- Item B: 4 units @ $80/unit

Result:
- Item A: $12 discount (2 units × $40 × 15% = $12)
- Item B: $36 discount (3 units × $80 × 15% = $36, remaining quota)
Total: $48 discount
```

**Scenario 5: Percentage with max_quantity = 1**
```javascript
{
  type: "percentage",
  allocation: "once",
  value: 25,         // 25% off
  max_quantity: 1    // Only one item
}

Cart:
- Item A: 3 units @ $60/unit
- Item B: 2 units @ $30/unit (lowest price)

Result: $7.50 discount on Item B (1 unit × $30 × 25%)
```

## Implementation

### 1. Schema Changes
- Add `once` to `ApplicationMethodAllocationValues` enum
- Update database constraint to accept new value

### 2. Validation
- Add `once` to allowed allocation types
- Require `max_quantity` when allocation is `once`
- Prevent `once` with `order` target type (incompatible)

### 3. Core Logic
- Sort eligible items by unit price (ascending)
- Track remaining quota across all items
- Apply promotion sequentially until quota exhausted
- Stop when `max_quantity` reached or items exhausted

### 4. Database Migration
```sql
ALTER TABLE "promotion_application_method"
DROP CONSTRAINT IF EXISTS "promotion_application_method_allocation_check";

ALTER TABLE "promotion_application_method"
ADD CONSTRAINT "promotion_application_method_allocation_check"
CHECK ("allocation" IN ('each', 'across', 'once'));
```

## Design Decisions

### 1. Lowest Price First
**Decision:** Always apply to lowest-priced items first.

**Rationale:**
- Benefits customers (better UX)
- Predictable behavior
- No configuration needed

**Alternative considered:** Allow merchants to choose priority (highest/lowest). Rejected as unnecessarily complex.

### 2. Sequential Distribution
**Decision:** Apply as much as possible to each item before moving to next.

**Rationale:**
- Simpler to understand and explain
- Predictable outcomes
- Easier to implement

### 3. Context-Agnostic Naming
**Decision:** Use generic "once" rather than "once_per_cart".

**Rationale:**
- Works for any target type (items, shipping methods, future types)
- Cleaner, shorter name
- Maintains abstraction from cart context

### 4. Internal Implementation
**Decision:** Treat `once` as `each` internally with dynamic `max_quantity`.

**Rationale:**
- Reuses existing calculation logic
- Avoids code duplication
- Easier to maintain

## Breaking Changes
None. This is purely additive.

## Testing

### Unit Tests
- Fixed promotions with various `max_quantity` values
- Percentage promotions
- Distribution across multiple items
- Interaction with target rules
- Edge cases (max_quantity=1, etc.)

### Integration Tests
- Cart creation with `once` allocation
- Cart completion with promotions applied
- Multiple products with different prices
- Percentage and fixed discount types

## Migration Path
1. Deploy backend changes
2. Run migration to update database constraint
3. Update admin UI to expose new allocation option
4. Update documentation

## Future Considerations
- Allow merchants to configure priority (lowest/highest price)
- Support "first N items added to cart" ordering
- Analytics on `once` allocation usage

## Files Changed
- `packages/core/utils/src/promotion/index.ts`
- `packages/modules/promotion/src/schema/index.ts`
- `packages/modules/promotion/src/utils/validations/application-method.ts`
- `packages/modules/promotion/src/utils/compute-actions/line-items.ts`
- `packages/modules/promotion/src/utils/compute-actions/shipping-methods.ts`
- `packages/modules/promotion/src/migrations/Migration20251006000000.ts`
- `packages/modules/promotion/integration-tests/__tests__/services/promotion-module/compute-actions.spec.ts`
- `integration-tests/http/__tests__/cart/store/cart.spec.ts`

## References
- Original discussion: Promotion module use case analysis
- Implementation PR: [TBD]
