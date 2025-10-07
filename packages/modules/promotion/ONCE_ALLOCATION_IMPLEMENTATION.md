# ONCE Allocation Implementation

## Overview
Added a new `once` allocation strategy to the promotion module that allows promotions to be applied a limited number of times across all items in a cart, rather than per item.

## Changes Made

### 1. Enum Updates
- **packages/core/utils/src/promotion/index.ts**
  - Added `ONCE = "once"` to `ApplicationMethodAllocation` enum

- **packages/modules/promotion/src/schema/index.ts**
  - Added `once` to `ApplicationMethodAllocationValues` enum

### 2. Validation Updates
- **packages/modules/promotion/src/utils/validations/application-method.ts**
  - Added `ONCE` to `allowedAllocationTypes`
  - Added `ONCE` to `allowedAllocationForQuantity` (requires `max_quantity` field)
  - Added validation to prevent `ONCE` allocation with `ORDER` target type (incompatible)

### 3. Core Logic Implementation
- **packages/modules/promotion/src/utils/compute-actions/line-items.ts**
  - Added `sortByPriceAscending()` helper to sort items by unit price (lowest first)
  - Added `getQuantityFromAmount()` helper to calculate quantity from discount amount
  - Modified `applyPromotionToItems()` to:
    - Sort applicable items by price when allocation is `ONCE`
    - Track remaining quota across all items
    - Stop applying when quota is exhausted
    - Treat `ONCE` internally as `EACH` with dynamic max_quantity per item

- **packages/modules/promotion/src/utils/compute-actions/shipping-methods.ts**
  - Added similar `sortByPriceAscending()` for shipping methods
  - Modified logic to handle `ONCE` allocation for shipping methods

### 4. Database Migration
- **packages/modules/promotion/src/migrations/Migration20251006000000.ts**
  - Updated check constraint on `promotion_application_method.allocation` to include `'once'`

### 5. Tests
- **integration-tests/__tests__/services/promotion-module/compute-actions.spec.ts**
  - Added comprehensive test suite for `ONCE` allocation including:
    - Fixed amount promotions with various `max_quantity` values
    - Percentage promotions
    - Distribution across multiple items
    - Interaction with target rules
    - Edge cases (max_quantity=1, etc.)

## Behavior

### Allocation Strategy: `ONCE`
- **Purpose**: Apply promotion to a maximum number of items across entire cart
- **Sorting**: Always applies to lowest-priced eligible items first
- **Distribution**: Applies as many units as possible to each item sequentially until `max_quantity` is reached
- **Required Field**: `max_quantity` must be specified

### Example Scenarios

#### Scenario 1: Fixed $10 discount, max_quantity: 2
```javascript
Cart:
- Item A: 3 units @ $100/unit
- Item B: 5 units @ $50/unit (lowest price)
- Item C: 2 units @ $75/unit

Result: $20 discount on Item B (2 units × $10)
```

#### Scenario 2: Fixed $5 discount, max_quantity: 4
```javascript
Cart:
- Item A: 2 units @ $50/unit (lowest)
- Item B: 3 units @ $60/unit

Result:
- $10 discount on Item A (2 units × $5)
- $10 discount on Item B (2 units × $5, remaining quota)
Total: $20 discount
```

#### Scenario 3: Percentage 20% off, max_quantity: 3
```javascript
Cart:
- Item A: 5 units @ $100/unit
- Item B: 4 units @ $50/unit (lowest)

Result: $30 discount on Item B (3 units × $50 × 20%)
```

## Key Design Decisions

1. **Context-Agnostic**: The field name and behavior work for any target type (items, shipping methods, etc.)
2. **Lowest Price First**: Always benefits customers by applying to cheapest items first
3. **Sequential Distribution**: Applies to items in order, making behavior predictable
4. **Internal Mapping**: `ONCE` is treated as `EACH` internally with dynamic quantity limits, avoiding code duplication
5. **Required max_quantity**: Enforced at validation level to ensure clear promotion limits

## Breaking Changes
None. This is a purely additive feature. Existing promotions with `each` or `across` allocation continue to work unchanged.

## Next Steps (UI Implementation)
1. Update admin UI promotion creation/edit forms to show `once` as an allocation option
2. Add tooltips/help text explaining the behavior
3. Update promotion preview to show how `once` allocation applies to example carts
4. Consider adding visual indicators in admin to distinguish `once` from other allocations
