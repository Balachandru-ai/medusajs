# Order Adjustment Versioning Implementation Plan

## Overview

This plan implements versioning for `order_shipping_method_adjustment` (similar to `order_line_item_adjustment`) and adds explicit deletion of current version adjustments when reverting an order to its previous version.

## Current State Analysis

### Order Line Item Adjustment Versioning

- **Model**: `packages/modules/order/src/models/line-item-adjustment.ts:7`

  - Has `version: model.number().default(1)` field
  - Belongs to `OrderLineItem` via `item` relationship

- **Migration**: `packages/modules/order/src/migrations/Migration20251016160403.ts`

  - Added `version` column with default value 1
  - Updates existing adjustments to match their associated `OrderItem` version

- **Version Creation Logic**: `packages/modules/order/src/utils/apply-order-changes.ts:99-111`
  - When `version > order.version`, new adjustments are created with the new version number
  - Adjustments are created via `lineItemAdjustmentsToCreate` array

### Order Shipping Method Adjustment Current State

- **Model**: `packages/modules/order/src/models/shipping-method-adjustment.ts`
  - **NO version field currently**
  - Belongs to `OrderShippingMethod` via `shipping_method` relationship

### Order Revert Implementation

- **Location**: `packages/modules/order/src/services/order-module-service.ts:3203-3330`
- **What Gets Soft-Deleted**:

  - Order Changes (by `order_id` + `version`)
  - Order Change Actions (by `order_id` + `version`)
  - Order Summary (by `order_id` + `version`)
  - Order Items (by `order_id` + `version`)
  - Order Shipping (by `order_id` + `version`)
  - Order Credit Lines (by `order_id` + `version`)
  - Returns (by `order_id` + `order_version`)

- **What Is NOT Handled**:
  - Line item adjustments (NOT deleted during revert)
  - Shipping method adjustments (NOT deleted during revert)

### Key Discoveries

1. **Cascade deletes don't apply**: The cascade delete on `OrderLineItem` only triggers when `OrderLineItem` itself is deleted, NOT when `OrderItem` is soft-deleted. Since revert soft-deletes `OrderItem` (the versioned entity), adjustments remain orphaned.

2. **Shipping method adjustments have no version awareness**: They are created but never versioned or cleaned up during order changes.

3. **The `compute-adjustments-for-preview` workflow only handles line item adjustments**: `packages/core/core-flows/src/order/workflows/compute-adjustments-for-preview.ts:134-153` - it doesn't create `SHIPPING_ADJUSTMENTS_REPLACE` actions.

## Desired End State

1. `order_shipping_method_adjustment` table has a `version` column with default value 1
2. When order changes are confirmed, shipping method adjustments are created with the new version number
3. When reverting an order (`revertLastVersion`), both line item adjustments AND shipping method adjustments for the current version are soft-deleted

### Verification

- Migration applies cleanly
- Existing adjustments are updated with correct versions
- New adjustments are created with correct version during order change confirmation
- Reverting an order deletes adjustments for the current version only
- Previous version adjustments remain intact

## What We're NOT Doing

- Adding a `SHIPPING_ADJUSTMENTS_REPLACE` change action type (would require significant workflow changes)
- Modifying the `compute-adjustments-for-preview` workflow to handle shipping adjustments
- Changing how shipping method adjustments are computed during order changes
- Adding version field to GraphQL schema (keeping it internal like line item adjustment version)

## Implementation Approach

The implementation follows the exact same pattern as the existing line item adjustment versioning:

1. Add `version` field to shipping method adjustment model
2. Create migration to add column and backfill existing data
3. Update `apply-order-changes.ts` to include shipping method adjustments with version
4. Update `revertLastChange_` to delete adjustments for the current version

## Phase 1: Add Version Field to Shipping Method Adjustment Model

### Overview

Add the `version` field to the `OrderShippingMethodAdjustment` model, matching the pattern used in `OrderLineItemAdjustment`.

### Changes Required:

#### 1. Model Definition

**File**: `packages/modules/order/src/models/shipping-method-adjustment.ts`
**Changes**: Add `version` field

```typescript
const _OrderShippingMethodAdjustment = model.define(
  {
    tableName: "order_shipping_method_adjustment",
    name: "OrderShippingMethodAdjustment",
  },
  {
    id: model.id({ prefix: "ordsmadj" }).primaryKey(),
    version: model.number().default(1), // ADD THIS LINE
    description: model.text().nullable(),
    promotion_id: model.text().nullable(),
    code: model.text().nullable(),
    amount: model.bigNumber(),
    provider_id: model.text().nullable(),
    shipping_method: model.belongsTo<() => typeof OrderShippingMethod>(
      () => OrderShippingMethod,
      {
        mappedBy: "adjustments",
      }
    ),
  }
)
// ... rest unchanged
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compilation passes: `yarn workspace @medusajs/order build`
- [x] Unit tests pass: `yarn workspace @medusajs/order test`

#### Manual Verification:

- [x] Model change appears correct in source

**Implementation Note**: After completing this phase and all automated verification passes, proceed to Phase 2 and Phase 3.

---

## Phase 2: Create Schema Migration

### Overview

Create a schema migration to add the `version` column and indexes to the `order_shipping_method_adjustment` table.

### Changes Required:

#### 1. Create Schema Migration

**Command**: Run migration creation script in the order module

```bash
cd packages/modules/order
yarn migration:create
```

This will create a new migration file based on the model changes from Phase 1.

### Success Criteria:

#### Automated Verification:

- [x] Migration creates correctly: `cd packages/modules/order && yarn migration:create`

#### Manual Verification:

- [x] Verify the migration SQL is correct by reviewing the generated migration
- [x] Migration applies cleanly on test database

**Implementation Note**:

- First, ensure Phase 1 (model changes) is complete and compiled successfully
- Run `yarn migration:create` in the order module directory to create the schema migration
- The generator will create a migration file with a timestamp and the statements necessary to represent the model defined
- Do NOT add data backfill logic here - that will be handled in Phase 3 with a data migration script

---

## Phase 3: Create Data Migration Script

### Overview

Create a data migration script to backfill existing `order_shipping_method_adjustment` records with the correct version based on their associated order shipping records.

### Changes Required:

#### 1. Create Data Migration Script

**File**: `packages/medusa/src/migration-scripts/backfill-shipping-adjustment-versions.ts` (new file)
**Changes**: Create data migration script

````typescript
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Data migration to backfill version field for existing order_shipping_method_adjustment records.
 * Sets adjustment versions based on the latest order_shipping version for their associated shipping method.
 */
```typescript
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function backfillShippingAdjustmentVersions({
  container,
}: {
  container: MedusaContainer
}) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // Execute the backfill query using knex
  await knex.transaction((trx) => {
    return trx.raw(`
        WITH latest_order_shipping_version AS (
        SELECT
            os.shipping_method_id AS shipping_method_id,
            MAX(os.version) AS version
        FROM "order_shipping" os
        GROUP BY os.shipping_method_id
        )
        UPDATE "order_shipping_method_adjustment" osma
        SET version = losv.version
        FROM latest_order_shipping_version losv
        WHERE osma.shipping_method_id = losv.shipping_method_id
        AND osma.version <> losv.version;
    `)
  }

  logger.info("Successfully backfilled shipping method adjustment versions")
}
````

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compilation passes: `yarn workspace @medusajs/medusa build`
- [x] Data migration can be executed without errors

#### Manual Verification:

- [x] Run the data migration on a test database with existing shipping method adjustments
- [x] Verify adjustments are updated with correct versions matching their associated order shipping records

**Implementation Note**:

- Data migration scripts are executed separately from schema migrations
- The script is guaranteed to be run only once by Medusa
- Test on a copy of production data before deploying
- The SQL query uses a CTE to find the latest order_shipping version for each shipping method, then updates adjustments accordingly

---

## Phase 4: Update Apply Order Changes to Handle Shipping Method Adjustment Versioning

### Overview

Update the `applyChangesToOrder` function to create shipping method adjustments with the correct version, similar to how line item adjustments are handled.

### Changes Required:

#### 1. Apply Order Changes Utility

**File**: `packages/modules/order/src/utils/apply-order-changes.ts`
**Changes**: Add `shippingMethodAdjustmentsToCreate` array and populate it with versioned adjustments

```typescript
// Add to imports if needed
import {
  CreateOrderLineItemAdjustmentDTO,
  CreateOrderShippingMethodAdjustmentDTO, // ADD THIS
  InferEntityType,
  OrderChangeActionDTO,
  OrderDTO,
} from "@medusajs/framework/types"

// Add new array declaration around line 36
const lineItemAdjustmentsToCreate: CreateOrderLineItemAdjustmentDTO[] = []
const shippingMethodAdjustmentsToCreate: CreateOrderShippingMethodAdjustmentDTO[] =
  [] // ADD THIS

// Inside the shipping method handling block (around lines 138-170), add adjustment handling:
// After line 168 (after shippingMethodsToUpsert.push(sm)), add:
if (version > order.version) {
  shippingMethod_.adjustments?.forEach((adjustment) => {
    shippingMethodAdjustmentsToCreate.push({
      shipping_method_id: associatedMethodId,
      version,
      amount: adjustment.amount,
      description: adjustment.description,
      promotion_id: adjustment.promotion_id,
      code: adjustment.code,
    })
  })
}

// Update the return statement to include the new array:
return {
  lineItemAdjustmentsToCreate,
  shippingMethodAdjustmentsToCreate, // ADD THIS
  itemsToUpsert,
  creditLinesToUpsert,
  shippingMethodsToUpsert,
  summariesToUpsert,
  orderToUpdate,
  calculatedOrders,
}
```

#### 2. Update Order Module Service

**File**: `packages/modules/order/src/services/order-module-service.ts`
**Changes**: Handle `shippingMethodAdjustmentsToCreate` in the confirm flow

Find where `lineItemAdjustmentsToCreate` is used (around line 3616-3623) and add similar handling for shipping method adjustments:

```typescript
// Around line 3616-3623, add after the lineItemAdjustmentsToCreate block:
lineItemAdjustmentsToCreate.length
  ? this.orderLineItemAdjustmentService_.create(
      lineItemAdjustmentsToCreate,
      sharedContext
    )
  : null,
shippingMethodAdjustmentsToCreate.length
  ? this.orderShippingMethodAdjustmentService_.create(
      shippingMethodAdjustmentsToCreate,
      sharedContext
    )
  : null,
```

Also update the destructuring where `applyChangesToOrder` is called to include `shippingMethodAdjustmentsToCreate`.

### Success Criteria:

#### Automated Verification:

- [ ] TypeScript compilation passes: `yarn workspace @medusajs/order build`
- [ ] Unit tests pass: `yarn workspace @medusajs/order test`
- [ ] Integration tests pass: `yarn test:integration:modules -- --testPathPattern=order`

#### Manual Verification:

- [ ] Create an order with shipping method adjustments (promotions)
- [ ] Make an order change (edit, exchange, etc.)
- [ ] Verify new shipping method adjustments are created with the new version number

**Implementation Note**: After completing this phase and all automated verification passes, proceed to Phase 5.

---

## Phase 5: Update Revert to Delete Current Version Adjustments

### Overview

Update the `revertLastChange_` method to explicitly delete both line item adjustments and shipping method adjustments for the current version being reverted.

### Changes Required:

#### 1. Order Module Service - Revert Method

**File**: `packages/modules/order/src/services/order-module-service.ts`
**Changes**: Add adjustment deletion to `revertLastChange_` method (around line 3286, after Order Shipping deletion)

```typescript
// Add after the Order Shipping block (around line 3286) and before Order Credit Lines:

// Line Item Adjustments
// First, get the item_ids from the orderItems we already queried
const itemIds = orderItems.map((orderItem) => orderItem.item_id)

if (itemIds.length) {
  const lineItemAdjustments = await this.orderLineItemAdjustmentService_.list(
    {
      item_id: itemIds,
      version: currentVersion,
    },
    { select: ["id"] },
    sharedContext
  )
  const lineItemAdjustmentIds = lineItemAdjustments.map((adj) => adj.id)

  if (lineItemAdjustmentIds.length) {
    updatePromises.push(
      this.orderLineItemAdjustmentService_.softDelete(
        lineItemAdjustmentIds,
        sharedContext
      )
    )
  }
}

// Shipping Method Adjustments
// Get the shipping_method_ids from the orderShippings we already queried
const shippingMethodIds = orderShippings.map(
  (orderShipping) => orderShipping.shipping_method_id
)

if (shippingMethodIds.length) {
  const shippingMethodAdjustments =
    await this.orderShippingMethodAdjustmentService_.list(
      {
        shipping_method_id: shippingMethodIds,
        version: currentVersion,
      },
      { select: ["id"] },
      sharedContext
    )
  const shippingMethodAdjustmentIds = shippingMethodAdjustments.map(
    (adj) => adj.id
  )

  if (shippingMethodAdjustmentIds.length) {
    updatePromises.push(
      this.orderShippingMethodAdjustmentService_.softDelete(
        shippingMethodAdjustmentIds,
        sharedContext
      )
    )
  }
}
```

### Success Criteria:

#### Automated Verification:

- [ ] TypeScript compilation passes: `yarn workspace @medusajs/order build`
- [ ] Unit tests pass: `yarn workspace @medusajs/order test`
- [ ] Integration tests pass: `yarn test:integration:modules -- --testPathPattern=order`

#### Manual Verification:

- [ ] Create an order with line item and shipping method adjustments
- [ ] Make an order change to increment version
- [ ] Revert the order
- [ ] Verify adjustments for the reverted version are soft-deleted
- [ ] Verify adjustments for previous versions remain intact

**Implementation Note**: The query uses `item_id` and `shipping_method_id` arrays extracted from the already-queried `orderItems` and `orderShippings`. This approach is efficient and leverages the existing queries in the revert method.

---

## Phase 6: Update Type Definitions

### Overview

Update the TypeScript type definitions to include the `version` field in shipping method adjustment DTOs.

### Changes Required:

#### 1. Create Order Shipping Method Adjustment DTO

**File**: `packages/core/types/src/order/mutations.ts`
**Changes**: Add `version` field to `CreateOrderShippingMethodAdjustmentDTO`

Around line 813-843, update the interface:

```typescript
export interface CreateOrderShippingMethodAdjustmentDTO {
  /**
   * The associated shipping method's ID.
   */
  shipping_method_id: string

  /**
   * The code of the adjustment.
   */
  code: string

  /**
   * The amount of the adjustment.
   */
  amount: BigNumberInput

  /**
   * The description of the adjustment.
   */
  description?: string

  /**
   * The associated promotion's ID.
   */
  promotion_id?: string

  /**
   * The associated provider's ID.
   */
  provider_id?: string

  /**
   * The version of the adjustment.
   */
  version?: number // ADD THIS
}
```

### Success Criteria:

#### Automated Verification:

- [ ] TypeScript compilation passes: `yarn workspace @medusajs/types build`
- [ ] Dependent packages compile: `yarn build`

#### Manual Verification:

- [ ] Type definitions are correct and consistent with line item adjustment pattern

---

## Phase 7: Add Integration Tests

### Overview

Add integration tests to verify the versioning and revert behavior for both line item and shipping method adjustments.

### Changes Required:

#### 1. Integration Test File

**File**: `packages/modules/order/integration-tests/__tests__/order-adjustment-versioning.spec.ts`
**Changes**: Create new test file or add to existing `order-edit.spec.ts`

```typescript
// Test cases to add:
describe("Order Adjustment Versioning", () => {
  it("should create line item adjustments with version when order version increases", async () => {
    // Create order with adjustments
    // Confirm order change (increment version)
    // Verify new adjustments have correct version
  })

  it("should create shipping method adjustments with version when order version increases", async () => {
    // Create order with shipping method adjustments
    // Confirm order change (increment version)
    // Verify new shipping method adjustments have correct version
  })

  it("should delete current version line item adjustments on revert", async () => {
    // Create order
    // Confirm order change (create new version adjustments)
    // Revert
    // Verify current version adjustments are soft-deleted
    // Verify previous version adjustments remain
  })

  it("should delete current version shipping method adjustments on revert", async () => {
    // Create order with shipping
    // Confirm order change (create new version adjustments)
    // Revert
    // Verify current version adjustments are soft-deleted
    // Verify previous version adjustments remain
  })
})
```

### Success Criteria:

#### Automated Verification:

- [ ] New integration tests pass: `yarn test:integration:modules -- --testPathPattern=order-adjustment-versioning`
- [ ] Existing integration tests still pass: `yarn test:integration:modules -- --testPathPattern=order`

#### Manual Verification:

- [ ] Tests cover the key scenarios outlined above
- [ ] Test assertions are comprehensive

---

## Testing Strategy

### Unit Tests

- Model field validation for `version` on shipping method adjustment
- Type checking for new DTO fields

### Integration Tests

- Order creation with adjustments (both types)
- Order change confirmation creates versioned adjustments
- Order revert deletes current version adjustments
- Multiple version changes maintain correct adjustment history

### Manual Testing Steps

1. Create an order with a promotion that applies to both line items and shipping
2. Apply an order edit that triggers adjustment recalculation
3. Verify new adjustments are created with version 2
4. Revert the order edit
5. Verify version 2 adjustments are soft-deleted
6. Verify version 1 adjustments remain intact

## Performance Considerations

- The revert operation now includes additional database queries for adjustments
- Database indexes on the `version` column have been added for both adjustment tables (see Phase 2) to optimize version-based queries
- The backfill migration may be slow on large datasets with many adjustments - monitor performance in production-like environments

## Migration Notes

- The migration adds a non-nullable column with a default value, which is safe for production
- Existing adjustments will be backfilled with the correct version based on their associated order shipping records
- If an adjustment has no associated order shipping record (orphaned), it will retain version 1

## References

- Line item adjustment versioning migration: `packages/modules/order/src/migrations/Migration20251016160403.ts`
- Line item adjustment model: `packages/modules/order/src/models/line-item-adjustment.ts`
- Order revert implementation: `packages/modules/order/src/services/order-module-service.ts:3203-3330`
- Apply order changes utility: `packages/modules/order/src/utils/apply-order-changes.ts`
