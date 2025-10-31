# RFC: Multi-Tenancy Support for Medusa

**Status:** Proposed  
**Date:** October 31, 2025  
**Author:** Medusa Community  
**Type:** Major Feature

---

## Executive Summary

This RFC proposes the addition of **true multi-tenancy** support to Medusa, enabling the platform to serve multiple completely independent organizations (tenants) from a single deployment and database instance—similar to the Shopify SaaS model. This is distinct from "multi-store" functionality, which allows a single organization to manage multiple shops or branches.

Multi-tenancy would position Medusa as a unique offering in the open-source e-commerce space, as most competitors (including Vendure) lack native multi-tenant capabilities.

---

## Problem Statement

### Current Situation

Today, Medusa supports:
- **Single-tenant deployments**: Each organization must deploy and manage their own Medusa instance
- **Multi-store (upcoming)**: A single organization can manage multiple stores/branches, but all within one tenant context

### What Multi-Tenancy Means

**True multi-tenancy** (like Shopify) means:
- Multiple **completely independent organizations/companies** share the same platform instance
- Each tenant has:
  - Its own isolated data (products, orders, customers, etc.)
  - Its own admin users and access controls
  - Its own configuration (currencies, regions, payment providers, etc.)
  - Its own branding and domain(s)
  - Its own billing/subscription plan
- Tenants are **unaware of each other** and cannot access each other's data
- All tenants share the same database and application infrastructure by design

### Use Cases

1. **SaaS E-commerce Platform**: Host thousands of independent merchants on one Medusa deployment
2. **Marketplace Operators**: Provide white-labeled e-commerce infrastructure to partners
3. **Agency/Reseller Model**: Manage multiple client stores from a single control plane
4. **Multi-brand Corporations**: Isolate different subsidiaries while sharing infrastructure
5. **Development/Testing**: Easily spin up isolated tenant environments without full deployments

---

## Goals

### Primary Goals

1. **Data Isolation**: Guarantee that tenants cannot access or interfere with each other's data
2. **Tenant Awareness**: All queries and operations automatically scope to the active tenant
3. **Onboarding**: Enable self-service tenant creation and provisioning
4. **Performance**: Maintain acceptable query performance as tenant count scales
5. **Backward Compatibility**: Existing single-tenant deployments continue to work unchanged

### Non-Goals (for initial implementation)

- Row-Level Security (RLS) enforcement at the database level (future enhancement)
- Per-tenant database encryption keys
- Advanced tenant lifecycle management (suspension, migration, backup/restore)
- Tenant-specific code/plugin isolation
- Multi-region tenant distribution

---

## Proposed Solution

### Architecture Overview

We propose a **shared database with tenant_id column** approach:

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Tenant A   │  │   Tenant B   │  │   Tenant C   │     │
│  │   Requests   │  │   Requests   │  │   Requests   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼────────┐   │
│  │         Tenant Context Middleware                    │   │
│  │  (Extract tenant from subdomain/header/JWT)          │   │
│  └──────┬─────────────────────────────────────────────┬─┘   │
│         │                                              │     │
│  ┌──────▼──────────────────────────────────────────────▼─┐  │
│  │         Tenant-Aware Repository Layer                 │  │
│  │  (Auto-inject WHERE tenant_id = :tenant filter)       │  │
│  └──────┬────────────────────────────────────────────────┘  │
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  products (tenant_id, id, title, ...)                │   │
│  │  orders   (tenant_id, id, customer_id, ...)          │   │
│  │  customers (tenant_id, id, email, ...)               │   │
│  │  tenants  (id, name, subdomain, config, ...)         │   │
│  └──────────────────────────────────────────────────────┘   │
│          Indexes on (tenant_id, ...) for performance         │
└──────────────────────────────────────────────────────────────┘
```

### Why This Approach?

| Approach                  | Pros                                                                                                          | Cons                                                                                       | Verdict                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------- |
| **Shared DB + tenant_id** | ✅ Simple to implement<br>✅ Easy cross-tenant queries (admin)<br>✅ Single migration/schema<br>✅ Cost-efficient | ⚠️ Requires careful scoping<br>⚠️ Risk of data leaks if bugs                                 | **✅ Recommended for PoC** |
| **PostgreSQL RLS**        | ✅ DB-enforced isolation<br>✅ Less application code risk                                                       | ❌ Complex migration patterns<br>❌ Performance overhead<br>❌ Limited ORM support            | 🔮 Future enhancement      |
| **Schema per tenant**     | ✅ Better isolation<br>✅ Easy backups                                                                          | ❌ Schema management complexity<br>❌ Migration hell at scale<br>❌ Connection pooling issues | ❌ Not scalable            |
| **DB per tenant**         | ✅ Strongest isolation<br>✅ Independent scaling                                                                | ❌ Operational nightmare<br>❌ Cost prohibitive<br>❌ Cross-tenant queries impossible         | ❌ Overkill                |

**Decision**: Start with **tenant_id column** approach for the PoC, with a migration path to RLS in the future.

---

## Detailed Design

### 1. Tenant Entity

Create a new `Tenant` module with the following model:

```typescript
// packages/modules/tenant/src/models/tenant.ts
const Tenant = model.define("Tenant", {
  id: model.id({ prefix: "tenant" }).primaryKey(),
  name: model.text().searchable(),
  slug: model.text(), // e.g., "acme-corp" for acme-corp.mystore.com
  subdomain: model.text().nullable(), // For subdomain-based routing
  custom_domain: model.text().nullable(), // e.g., "shop.acme.com"
  status: model.enum(TenantStatus).default(TenantStatus.ACTIVE),
  
  // Configuration
  default_currency_code: model.text().default("usd"),
  default_region_id: model.text().nullable(),
  metadata: model.json().nullable(),
  
  // Billing/Limits (future use)
  plan_id: model.text().nullable(),
  max_products: model.number().nullable(),
  max_orders_per_month: model.number().nullable(),
  
  // Timestamps
  trial_ends_at: model.dateTime().nullable(),
  suspended_at: model.dateTime().nullable(),
}).indexes([
  { on: ["slug"], unique: true, where: "deleted_at IS NULL" },
  { on: ["subdomain"], unique: true, where: "deleted_at IS NULL AND subdomain IS NOT NULL" },
  { on: ["custom_domain"], unique: true, where: "deleted_at IS NULL AND custom_domain IS NOT NULL" },
])
```

### 2. Add tenant_id to Core Entities

Modify core models to include tenant_id:

```typescript
// packages/modules/product/src/models/product.ts
const Product = model.define("Product", {
  id: model.id({ prefix: "prod" }).primaryKey(),
  tenant_id: model.text(), // <-- ADD THIS
  title: model.text().searchable(),
  // ... rest of fields
}).indexes([
  // Add tenant_id to all existing indexes
  { on: ["tenant_id", "handle"], unique: true, where: "deleted_at IS NULL" },
  { on: ["tenant_id", "status"], unique: false },
  // ... other indexes
])
```

**Entities requiring tenant_id**:
- ✅ Product, ProductVariant, ProductOption, ProductImage
- ✅ ProductCollection, ProductCategory, ProductTag, ProductType
- ✅ Customer, CustomerAddress, CustomerGroup
- ✅ Order, OrderItem, OrderAddress, OrderShipping, Return, Exchange, Claim
- ✅ Cart, CartItem, CartAddress
- ✅ Payment, PaymentCollection, Fulfillment
- ✅ PriceList, MoneyAmount, Discount, Promotion
- ✅ Region, Currency, ShippingOption, ShippingProfile
- ✅ Store (one per tenant, or tenant points to a store)
- ✅ Notification, ApiKey, Workflow executions

**Entities NOT needing tenant_id** (system-level):
- ❌ User (admins can belong to multiple tenants)
- ❌ Auth providers/configurations
- ❌ File uploads (tenant_id in metadata instead)
- ❌ System settings

### 3. Tenant Context Middleware

Create middleware to extract and validate tenant from request:

```typescript
// packages/medusa/src/api/middlewares/tenant-context.ts
import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export async function tenantContext(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const tenantId = await extractTenantId(req)
    
    if (!tenantId) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        "Tenant context is required"
      )
    }
    
    // Validate tenant exists and is active
    const tenantService = req.scope.resolve("tenantService")
    const tenant = await tenantService.retrieve(tenantId)
    
    if (tenant.status !== "active") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Tenant is ${tenant.status}`
      )
    }
    
    // Attach to request context
    req.tenantId = tenantId
    req.tenant = tenant
    
    // Attach to scope for repository access
    req.scope.register({
      tenantId: asValue(tenantId),
    })
    
    next()
  } catch (error) {
    next(error)
  }
}

async function extractTenantId(req: MedusaRequest): Promise<string | null> {
  // Strategy 1: From JWT claim (for authenticated requests)
  if (req.auth?.tenant_id) {
    return req.auth.tenant_id
  }
  
  // Strategy 2: From subdomain (e.g., acme.mystore.com -> tenant_acme123)
  const hostname = req.get("host")
  const subdomain = hostname?.split(".")[0]
  if (subdomain && subdomain !== "www") {
    const tenantService = req.scope.resolve("tenantService")
    const tenant = await tenantService.retrieveBySubdomain(subdomain)
    return tenant?.id
  }
  
  // Strategy 3: From custom header (for API clients)
  const headerTenantId = req.get("x-tenant-id")
  if (headerTenantId) {
    return headerTenantId
  }
  
  // Strategy 4: From custom domain mapping
  if (hostname) {
    const tenantService = req.scope.resolve("tenantService")
    const tenant = await tenantService.retrieveByCustomDomain(hostname)
    return tenant?.id
  }
  
  return null
}
```

### 4. Tenant-Aware Repository Layer

Modify the base MikroORM repository to automatically inject tenant scoping:

```typescript
// packages/core/utils/src/dal/mikro-orm/mikro-orm-repository.ts
export class MikroOrmBaseRepository<const T extends object = object> {
  // ... existing code ...
  
  private injectTenantFilter(
    filters: FilterQuery<T>,
    context?: Context
  ): FilterQuery<T> {
    const tenantId = context?.tenantId
    
    // Skip tenant filtering for system queries or if entity doesn't have tenant_id
    if (!tenantId || !this.entityHasTenantId()) {
      return filters
    }
    
    // Inject tenant_id filter
    return {
      ...filters,
      tenant_id: tenantId,
    } as FilterQuery<T>
  }
  
  private entityHasTenantId(): boolean {
    const properties = this.entity.prototype.__meta?.properties
    return properties?.tenant_id !== undefined
  }
  
  async find(
    filters: FilterQuery<T> = {} as FilterQuery<T>,
    options: FindOptions<T> = {},
    context: Context = {}
  ): Promise<InferRepositoryReturnType<T>[]> {
    const scopedFilters = this.injectTenantFilter(filters, context)
    // ... rest of existing find logic
  }
  
  async findAndCount(/* ... */): Promise<[InferRepositoryReturnType<T>[], number]> {
    const scopedFilters = this.injectTenantFilter(filters, context)
    // ... rest of existing findAndCount logic
  }
  
  // Apply to all query methods: findOne, create, update, delete, etc.
}
```

**Key principle**: Every repository query automatically adds `WHERE tenant_id = :tenantId` unless explicitly bypassed (for system operations).

### 5. Database Migrations

Create migrations to add tenant_id columns:

```typescript
// packages/medusa/src/migrations/1730390000000_add_tenant_id_to_core_entities.ts
export async function up(db: Knex): Promise<void> {
  // Add tenant_id column to all core tables
  const tables = [
    'product', 'product_variant', 'product_option', 'product_image',
    'product_collection', 'product_category', 'product_tag', 'product_type',
    'customer', 'customer_address', 'customer_group',
    'order', 'order_item', 'order_address', 'return', 'exchange', 'claim',
    'cart', 'line_item',
    'payment', 'payment_collection', 'fulfillment',
    'price_list', 'discount', 'promotion',
    'region', 'shipping_option', 'shipping_profile',
    'store', 'notification', 'api_key',
  ]
  
  for (const table of tables) {
    await db.schema.alterTable(table, (t) => {
      t.string('tenant_id').nullable() // Nullable initially for existing data
      t.index(['tenant_id'])
    })
  }
  
  // For existing single-tenant deployments, create a default tenant
  // and assign all existing data to it
  const [defaultTenant] = await db('tenant')
    .insert({
      id: 'tenant_default',
      name: 'Default Tenant',
      slug: 'default',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('id')
  
  // Update all existing records to belong to default tenant
  for (const table of tables) {
    await db(table)
      .whereNull('tenant_id')
      .update({ tenant_id: defaultTenant.id })
  }
  
  // Now make tenant_id NOT NULL
  for (const table of tables) {
    await db.schema.alterTable(table, (t) => {
      t.string('tenant_id').notNullable().alter()
    })
  }
  
  // Add composite indexes for common queries
  await db.schema.alterTable('product', (t) => {
    t.index(['tenant_id', 'status'])
    t.index(['tenant_id', 'handle'])
  })
  
  await db.schema.alterTable('order', (t) => {
    t.index(['tenant_id', 'customer_id'])
    t.index(['tenant_id', 'status'])
  })
  
  await db.schema.alterTable('customer', (t) => {
    t.index(['tenant_id', 'email'])
  })
}

export async function down(db: Knex): Promise<void> {
  // Remove tenant_id columns
  const tables = [/* same list */]
  
  for (const table of tables) {
    await db.schema.alterTable(table, (t) => {
      t.dropColumn('tenant_id')
    })
  }
}
```

### 6. Tenant Management APIs

Create admin endpoints for tenant management:

```typescript
// packages/medusa/src/api/admin/tenants/route.ts

// POST /admin/tenants - Create new tenant
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateTenantType>,
  res: MedusaResponse<AdminTenantResponse>
) => {
  // Only super-admin can create tenants
  if (!req.auth.is_super_admin) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED)
  }
  
  const tenantService = req.scope.resolve("tenantService")
  
  const tenant = await tenantService.create(req.validatedBody, {
    skipTenantScoping: true, // System operation
  })
  
  // Initialize default store, regions, currencies for tenant
  await initializeTenantDefaults(tenant.id)
  
  res.json({ tenant })
}

// GET /admin/tenants - List all tenants (super-admin only)
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminTenantListParams>,
  res: MedusaResponse<AdminTenantsListResponse>
) => {
  if (!req.auth.is_super_admin) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED)
  }
  
  const tenantService = req.scope.resolve("tenantService")
  
  const [tenants, count] = await tenantService.listAndCount(
    req.filterableFields,
    req.listConfig,
    { skipTenantScoping: true }
  )
  
  res.json({ tenants, count, offset: req.listConfig.skip, limit: req.listConfig.take })
}
```

### 7. Authentication & Authorization

Extend JWT to include tenant context:

```typescript
// When user logs in, include their tenant_id in the JWT
{
  "user_id": "user_123",
  "tenant_id": "tenant_abc",
  "is_super_admin": false,
  "exp": 1730390000
}

// Super-admins can operate across tenants
{
  "user_id": "user_admin",
  "is_super_admin": true,
  "tenant_id": null, // Can be set per-request via header
  "exp": 1730390000
}
```

Extend the User-Tenant relationship:

```typescript
// New entity: UserTenant (many-to-many with roles)
const UserTenant = model.define("UserTenant", {
  id: model.id().primaryKey(),
  user_id: model.text(),
  tenant_id: model.text(),
  role: model.enum(["admin", "manager", "staff"]),
  invited_at: model.dateTime().nullable(),
  accepted_at: model.dateTime().nullable(),
}).indexes([
  { on: ["user_id", "tenant_id"], unique: true },
  { on: ["tenant_id"] },
])
```

### 8. Storefront Integration

For store/customer-facing APIs, tenant resolution works via:

1. **Subdomain routing**: `acme.store.com` → tenant_acme
2. **Custom domain**: `shop.acme.com` → tenant_acme (via domain mapping)
3. **API key**: Store API keys include tenant context

```typescript
// Store API request with tenant resolution
GET https://acme.mystore.com/store/products
→ Middleware extracts tenant_id from subdomain
→ All product queries auto-scoped to that tenant

GET https://api.mystore.com/store/products
Headers: X-Publishable-API-Key: pk_tenant_abc_...
→ API key contains tenant_id
→ Queries scoped to tenant_abc
```

---

## Implementation Phases

### Phase 1: Foundation (PoC) ✅ This RFC

**Goal**: Prove the concept works for core entities

- [ ] Create Tenant module and entity
- [ ] Add tenant_id to Product, Customer, Order entities
- [ ] Implement tenant context middleware
- [ ] Modify base repository with tenant filtering
- [ ] Create database migration
- [ ] Build basic tenant CRUD admin APIs
- [ ] Write integration tests showing data isolation

**Timeline**: 2-3 weeks  
**Risk**: Low - contained changes

### Phase 2: Complete Entity Coverage

**Goal**: Extend tenant_id to all remaining entities

- [ ] Add tenant_id to all 50+ entities (carts, payments, promotions, etc.)
- [ ] Comprehensive migration scripts
- [ ] Audit all repository methods for tenant scoping
- [ ] Add tenant switching for super-admins

**Timeline**: 3-4 weeks  
**Risk**: Medium - large migration surface

### Phase 3: Tenant Lifecycle & Management

**Goal**: Production-ready tenant operations

- [ ] Self-service tenant registration API/UI
- [ ] Tenant onboarding workflow (with default data seeding)
- [ ] Tenant suspension/reactivation
- [ ] Billing integration hooks (subscription plans)
- [ ] Usage metrics per tenant (order count, storage, API calls)

**Timeline**: 3-4 weeks  
**Risk**: Medium - new business logic

### Phase 4: Advanced Features

**Goal**: Enterprise-grade capabilities

- [ ] PostgreSQL Row-Level Security (RLS) migration path
- [ ] Per-tenant backup/restore
- [ ] Tenant cloning (for staging/development)
- [ ] Rate limiting per tenant
- [ ] Multi-region tenant placement
- [ ] Tenant-specific feature flags
- [ ] Advanced observability (per-tenant metrics, logs)

**Timeline**: 4-6 weeks  
**Risk**: High - complex infrastructure changes

---

## Migration Strategy

### For Existing Medusa Installations

Existing single-tenant Medusa deployments will continue to work:

1. **Run migration**: Adds `tenant_id` column, creates "Default Tenant", assigns all data to it
2. **No code changes required**: Middleware detects single-tenant mode (only one tenant exists)
3. **Opt-in to multi-tenancy**: Admins can create additional tenants when ready

### For New Installations

- Default tenant created during setup
- Option to enable "Multi-tenant mode" in admin UI
- Alternatively, API-driven tenant provisioning for SaaS deployments

---

## Security Considerations

### Threat Model

| Threat                             | Mitigation                                             | Priority   |
| ---------------------------------- | ------------------------------------------------------ | ---------- |
| **Tenant data leakage**            | Repository-level filtering, integration tests          | 🔴 Critical |
| **Privilege escalation**           | Role-based access per tenant, JWT tenant_id validation | 🔴 Critical |
| **SQL injection**                  | Parameterized queries (MikroORM default)               | 🔴 Critical |
| **Tenant enumeration**             | Randomized tenant IDs, no public tenant listing        | 🟡 Medium   |
| **Cross-tenant API key usage**     | Bind API keys to tenant_id, validate on each request   | 🔴 Critical |
| **Admin spoofing**                 | JWT signature validation, short expiry                 | 🔴 Critical |
| **Bulk operations across tenants** | Require `skipTenantScoping` flag + super-admin role    | 🟡 Medium   |

### Best Practices

1. **Fail secure**: If tenant_id cannot be determined, reject the request (no fallback)
2. **Audit logging**: Log all tenant context switches and super-admin operations
3. **Regular audits**: Automated tests to verify tenant isolation (see Testing section)
4. **Rate limiting**: Per-tenant API rate limits to prevent noisy neighbors
5. **Secrets management**: Store tenant-specific secrets (payment keys, etc.) encrypted with tenant_id

---

## Performance Considerations

### Index Strategy

Every query now includes `WHERE tenant_id = :id`, requiring composite indexes:

```sql
-- Good: Efficient tenant + filter queries
CREATE INDEX idx_product_tenant_status ON product(tenant_id, status);
CREATE INDEX idx_order_tenant_customer ON order(tenant_id, customer_id);

-- Bad: Single-column indexes require sequential scan
CREATE INDEX idx_product_status ON product(status); -- Must scan all tenants!
```

**Action**: Audit all existing indexes and add tenant_id as the first column.

### Query Performance

- **Small tenants (< 10k records)**: No noticeable impact
- **Large tenants (> 100k records)**: Same as single-tenant (indexed tenant_id)
- **Cross-tenant queries**: Only for super-admin operations (rare)

### Caching

- Existing query caching works per-tenant (cache key includes tenant_id)
- Redis keys should be namespaced: `tenant:abc:product:123`

### Database Limits

PostgreSQL can handle:
- **1000 tenants** with 10k products each = 10M products (manageable)
- **10,000 tenants** requires careful index tuning and partitioning
- **100,000+ tenants** may require sharding strategy (future work)

**Recommendation**: Start with 10k tenant target, plan for 50k max in v1.

---

## Testing Strategy

### Unit Tests

```typescript
describe("Tenant-aware repositories", () => {
  it("filters products by tenant_id", async () => {
    const tenant1 = await createTenant({ name: "Tenant 1" })
    const tenant2 = await createTenant({ name: "Tenant 2" })
    
    await createProduct({ tenant_id: tenant1.id, title: "Product A" })
    await createProduct({ tenant_id: tenant2.id, title: "Product B" })
    
    const products = await productService.list({}, { tenantId: tenant1.id })
    
    expect(products).toHaveLength(1)
    expect(products[0].title).toBe("Product A")
  })
  
  it("prevents cross-tenant data access", async () => {
    const tenant1 = await createTenant({ name: "Tenant 1" })
    const tenant2 = await createTenant({ name: "Tenant 2" })
    
    const product = await createProduct({ tenant_id: tenant1.id })
    
    await expect(
      productService.retrieve(product.id, { tenantId: tenant2.id })
    ).rejects.toThrow("Product not found")
  })
})
```

### Integration Tests

```typescript
describe("Multi-tenant API isolation", () => {
  it("tenant A cannot list tenant B's orders", async () => {
    const tenantA = await setupTenant("tenant-a")
    const tenantB = await setupTenant("tenant-b")
    
    await createOrder({ tenant_id: tenantB.id, total: 100 })
    
    const response = await api
      .get("/admin/orders")
      .set("Authorization", tenantA.adminToken)
    
    expect(response.body.orders).toHaveLength(0)
  })
  
  it("subdomain routing works correctly", async () => {
    await setupTenant("acme", { subdomain: "acme" })
    
    const response = await api
      .get("/store/products")
      .set("Host", "acme.mystore.com")
    
    expect(response.status).toBe(200)
    expect(response.body.products).toBeDefined()
  })
})
```

### Security Audits

- **Automated scans**: Run SQL query logs through analyzer to detect missing tenant filters
- **Penetration testing**: Hire security firm to attempt cross-tenant access
- **Chaos engineering**: Randomly inject wrong tenant_id to verify error handling

---

## Open Questions & Future Work

### Open Questions

1. **Should Users belong to multiple tenants?**
   - **Option A**: Yes, via UserTenant join table (enables agencies/consultants)
   - **Option B**: No, one user per tenant (simpler, use separate accounts)
   - **Recommendation**: Option A for flexibility

2. **How to handle shared reference data?**
   - Example: Country codes, currency definitions, tax rate structures
   - **Option A**: Duplicate in each tenant (isolation)
   - **Option B**: Global reference tables (efficiency)
   - **Recommendation**: Hybrid - global for immutable data, tenant-scoped for mutable

3. **Tenant deletion strategy?**
   - **Soft delete** (keep data for 30 days) vs **Hard delete** (immediate purge)
   - **Recommendation**: Soft delete with async purge job

4. **How to handle file uploads?**
   - **Option A**: S3 bucket per tenant (strong isolation)
   - **Option B**: Shared bucket with tenant_id prefix (cost-effective)
   - **Recommendation**: Option B with signed URLs

### Future Enhancements

- **PostgreSQL Row-Level Security (RLS)**: Database-enforced tenant filtering
- **Tenant sharding**: Distribute large tenants across multiple databases
- **Geographic tenant placement**: GDPR compliance, data residency
- **Tenant-specific plugins**: Load different plugins per tenant
- **White-labeling**: Per-tenant admin UI themes
- **Tenant analytics dashboard**: Usage, growth, health metrics
- **Automated tenant scaling**: Auto-upgrade plans based on usage

---

## Success Metrics

### Technical Metrics

- ✅ 100% of core entities have tenant_id
- ✅ 0 cross-tenant data leaks in security audits
- ✅ < 10ms overhead per query from tenant filtering
- ✅ 10,000 tenants supported in load tests
- ✅ 99.9% uptime maintained during tenant operations

### Business Metrics

- 🎯 20+ tenants onboarded in first month (post-GA)
- 🎯 50% of tenants upgrade from trial to paid plan
- 🎯 < 5% churn rate due to multi-tenancy issues
- 🎯 5x increase in self-hosted → managed migration (agencies)

---

## Alternatives Considered

### 1. Separate Medusa Instance per Tenant

**Pros**: Perfect isolation, simple architecture  
**Cons**: Operational nightmare, high cost, no shared infrastructure benefits  
**Verdict**: ❌ Defeats the purpose of multi-tenancy

### 2. Microservices with Tenant Routing

**Pros**: Scalable, modern architecture  
**Cons**: Massive refactor, complexity explosion  
**Verdict**: ❌ Too ambitious for initial implementation

### 3. Plugin-Based Multi-Tenancy

**Pros**: Opt-in, doesn't change core  
**Cons**: Hard to enforce, inconsistent experience  
**Verdict**: ❌ Multi-tenancy should be core, not plugin

### 4. Blockchain/Distributed Ledger per Tenant

**Pros**: Ultimate auditability  
**Cons**: Performance, cost, overkill  
**Verdict**: ❌ 😄

---

## References

- [Designing Multi-Tenant Applications (Microsoft)](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)
- [Multi-Tenancy in PostgreSQL (Citus Data)](https://www.citusdata.com/blog/2016/10/03/designing-your-saas-database-for-high-scalability/)
- [Shopify's Sharding Journey](https://shopify.engineering/sharding-at-shopify)
- [Stripe's Multi-Tenancy Architecture](https://stripe.com/blog/online-migrations)
- [OWASP Multi-Tenancy Security](https://owasp.org/www-community/Multi-Tenancy_Security)

---

## Appendix: Sample Code

### Complete Tenant Model

```typescript
// packages/modules/tenant/src/models/tenant.ts
import { model } from "@medusajs/framework/utils"

export enum TenantStatus {
  ACTIVE = "active",
  TRIAL = "trial",
  SUSPENDED = "suspended",
  DELETED = "deleted",
}

const Tenant = model
  .define("Tenant", {
    id: model.id({ prefix: "tenant" }).primaryKey(),
    name: model.text().searchable(),
    slug: model.text(),
    subdomain: model.text().nullable(),
    custom_domain: model.text().nullable(),
    status: model.enum(TenantStatus).default(TenantStatus.TRIAL),
    
    // Owner
    owner_user_id: model.text(),
    
    // Configuration
    default_currency_code: model.text().default("usd"),
    default_region_id: model.text().nullable(),
    default_sales_channel_id: model.text().nullable(),
    
    // Branding
    logo_url: model.text().nullable(),
    primary_color: model.text().nullable(),
    
    // Billing
    plan_id: model.text().nullable(),
    stripe_customer_id: model.text().nullable(),
    
    // Limits
    max_products: model.number().nullable(),
    max_orders_per_month: model.number().nullable(),
    max_storage_gb: model.number().nullable(),
    
    // Timestamps
    trial_ends_at: model.dateTime().nullable(),
    suspended_at: model.dateTime().nullable(),
    
    // Metadata
    metadata: model.json().nullable(),
  })
  .indexes([
    { on: ["slug"], unique: true, where: "deleted_at IS NULL" },
    { on: ["subdomain"], unique: true, where: "deleted_at IS NULL AND subdomain IS NOT NULL" },
    { on: ["custom_domain"], unique: true, where: "deleted_at IS NULL AND custom_domain IS NOT NULL" },
    { on: ["status"] },
    { on: ["owner_user_id"] },
  ])

export default Tenant
```

### Tenant Context Type Definitions

```typescript
// packages/core/types/src/http/common/medusa-request.ts
export interface MedusaRequest extends Request {
  // ... existing fields ...
  
  // Multi-tenancy fields
  tenantId?: string
  tenant?: {
    id: string
    name: string
    status: string
    plan_id?: string
  }
}

// packages/core/types/src/common/context.ts
export interface Context {
  // ... existing fields ...
  
  tenantId?: string
  skipTenantScoping?: boolean // For super-admin operations
}
```

---

## Conclusion

This RFC proposes a pragmatic, phased approach to adding true multi-tenancy to Medusa:

1. **Phase 1 (PoC)**: Prove the concept with tenant_id filtering on core entities
2. **Phase 2**: Extend to all entities and production-harden
3. **Phase 3**: Add tenant lifecycle management and billing
4. **Phase 4**: Advanced features (RLS, sharding, etc.)

**The key differentiator**: Unlike competitors, Medusa would offer **SaaS-grade multi-tenancy out of the box**, enabling new business models (e-commerce platform providers, agencies, white-label solutions) while maintaining backward compatibility for single-tenant deployments.

**Next steps**:
1. Community feedback on this RFC
2. Approval from core team
3. Begin Phase 1 implementation (PoC branch)
4. Iterate based on testing and feedback

---

**Questions? Feedback?** Please comment on the RFC discussion thread or reach out to the maintainers.
