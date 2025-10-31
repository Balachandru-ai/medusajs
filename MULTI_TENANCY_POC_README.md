# Multi-Tenancy Proof of Concept (PoC)

This branch contains a working proof-of-concept implementation of **true multi-tenancy** for Medusa, as described in the [RFC](/workspaces/medusa/RFC_MULTI_TENANCY.md).

## 🎯 What's Implemented

This PoC demonstrates:

1. ✅ **Tenant Module**: New `@medusajs/tenant` module with Tenant entity and service
2. ✅ **Tenant Scoping**: Automatic `tenant_id` filtering in repository queries
3. ✅ **Tenant Context**: Middleware to extract tenant from requests (header/subdomain)
4. ✅ **Core Entity Updates**: `tenant_id` added to Product, Customer, and Order models
5. ✅ **Admin APIs**: CRUD endpoints for tenant management
6. ✅ **Data Isolation**: Integration tests proving tenant data isolation

## 📁 Files Changed

### New Files

- **`packages/modules/tenant/`** - Complete Tenant module
  - `src/models/tenant.ts` - Tenant data model
  - `src/services/tenant-module.ts` - Tenant service with CRUD operations
  - `integration-tests/multi-tenancy.spec.ts` - Test suite

- **`packages/medusa/src/api/admin/tenants/`** - Admin API routes
  - `route.ts` - GET/POST endpoints for tenant list/create
  - `[id]/route.ts` - GET/POST/DELETE for single tenant
  - `middlewares.ts` - Validation middleware
  - `validators.ts` - Zod schemas

- **`packages/medusa/src/api/lib/tenant-context.ts`** - Tenant context middleware

- **`RFC_MULTI_TENANCY.md`** - Comprehensive RFC document

### Modified Files

- **`packages/modules/product/src/models/product.ts`** - Added `tenant_id` field and updated indexes
- **`packages/modules/customer/src/models/customer.ts`** - Added `tenant_id` field and updated indexes
- **`packages/modules/order/src/models/order.ts`** - Added `tenant_id` field and updated indexes

- **`packages/core/utils/src/dal/mikro-orm/mikro-orm-repository.ts`** - Added tenant filtering logic:
  - `entityHasTenantId()` - Check if entity has tenant_id field
  - `injectTenantFilter()` - Automatically add tenant_id to queries
  - `injectTenantData()` - Automatically add tenant_id to creates

- **`packages/core/types/src/shared-context.ts`** - Extended Context type:
  - `tenantId?: string` - Current tenant ID
  - `skipTenantScoping?: boolean` - Flag to bypass scoping

- **`packages/medusa/src/api/middlewares.ts`** - Registered tenant routes

## 🚀 How It Works

### Architecture

```
Request → Tenant Middleware → Repository Layer → Database
              ↓                      ↓
         Extract tenant_id    Auto-inject WHERE
         from header/sub      tenant_id = :id
```

### Tenant Resolution Strategies

The middleware supports multiple ways to determine tenant context:

1. **X-Tenant-ID Header** (easiest for testing):
   ```bash
   curl -H "X-Tenant-ID: tenant_abc123" http://localhost:9000/admin/products
   ```

2. **Subdomain**:
   ```bash
   # tenant1.mystore.com → resolves to tenant with subdomain="tenant1"
   curl http://tenant1.localhost:9000/store/products
   ```

3. **Custom Domain**:
   ```bash
   # shop.acme.com → resolves to tenant with custom_domain="shop.acme.com"
   ```

4. **JWT Claim** (future):
   ```json
   {
     "user_id": "user_123",
     "tenant_id": "tenant_abc"
   }
   ```

### Repository Behavior

All queries automatically inject tenant filtering:

```typescript
// Without multi-tenancy:
SELECT * FROM product WHERE status = 'published'

// With multi-tenancy (tenantId in context):
SELECT * FROM product WHERE tenant_id = 'tenant_abc' AND status = 'published'

// System/super-admin operations (skipTenantScoping = true):
SELECT * FROM product WHERE status = 'published'  // No tenant filter
```

## 🧪 Testing

### Run Integration Tests

```bash
cd packages/modules/tenant
yarn test
```

### Manual Testing

1. **Start Medusa**:
   ```bash
   cd packages/medusa
   yarn dev
   ```

2. **Create Tenants**:
   ```bash
   # Create tenant 1
   curl -X POST http://localhost:9000/admin/tenants \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Acme Corp",
       "slug": "acme",
       "subdomain": "acme"
     }'
   
   # Create tenant 2
   curl -X POST http://localhost:9000/admin/tenants \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Beta Inc",
       "slug": "beta",
       "subdomain": "beta"
     }'
   ```

3. **List Tenants**:
   ```bash
   curl http://localhost:9000/admin/tenants
   ```

4. **Create Products for Each Tenant**:
   ```bash
   # Product for tenant 1
   curl -X POST http://localhost:9000/admin/products \
     -H "Content-Type: application/json" \
     -H "X-Tenant-ID: tenant_abc123" \
     -d '{
       "title": "Acme Product",
       "tenant_id": "tenant_abc123"
     }'
   
   # Product for tenant 2
   curl -X POST http://localhost:9000/admin/products \
     -H "Content-Type: application/json" \
     -H "X-Tenant-ID: tenant_xyz456" \
     -d '{
       "title": "Beta Product",
       "tenant_id": "tenant_xyz456"
     }'
   ```

5. **Verify Isolation**:
   ```bash
   # List products for tenant 1 (should only see Acme Product)
   curl http://localhost:9000/admin/products \
     -H "X-Tenant-ID: tenant_abc123"
   
   # List products for tenant 2 (should only see Beta Product)
   curl http://localhost:9000/admin/products \
     -H "X-Tenant-ID: tenant_xyz456"
   ```

## 📋 API Examples

### Tenant Management

```typescript
// POST /admin/tenants - Create tenant
{
  "name": "Acme Corp",
  "slug": "acme",
  "subdomain": "acme",
  "custom_domain": "shop.acme.com",
  "default_currency_code": "usd",
  "metadata": {
    "plan": "premium"
  }
}

// GET /admin/tenants - List all tenants
// Returns:
{
  "tenants": [
    {
      "id": "tenant_abc123",
      "name": "Acme Corp",
      "slug": "acme",
      "subdomain": "acme",
      "status": "active",
      ...
    }
  ],
  "count": 1
}

// GET /admin/tenants/:id - Get single tenant
// POST /admin/tenants/:id - Update tenant
// DELETE /admin/tenants/:id - Delete tenant
```

### Product Operations with Tenant Context

```typescript
// Create product (tenant_id auto-injected from context)
POST /admin/products
Headers: X-Tenant-ID: tenant_abc123
{
  "title": "My Product",
  "tenant_id": "tenant_abc123"  // Must match context or omit
}

// List products (auto-filtered by tenant_id)
GET /admin/products
Headers: X-Tenant-ID: tenant_abc123
// Only returns products with tenant_id = tenant_abc123

// Retrieve product (must belong to tenant)
GET /admin/products/prod_123
Headers: X-Tenant-ID: tenant_abc123
// Returns 404 if product doesn't belong to tenant
```

## 🔒 Security Considerations

### Current Implementation (PoC)

- ✅ Tenant filtering in repository layer
- ✅ Tenant validation in middleware
- ✅ Context-based scoping
- ⚠️ **No authentication required** (for PoC testing)
- ⚠️ **No authorization/RBAC** (all users can access all tenants with header)

### Production Requirements

For production use, you MUST add:

1. **Authentication**: Verify user identity
2. **Authorization**: Validate user has access to requested tenant
   ```typescript
   if (req.auth.user.tenant_id !== req.tenantId) {
     throw new MedusaError(MedusaError.Types.UNAUTHORIZED)
   }
   ```
3. **Super-admin role**: Users who can access multiple tenants
4. **Audit logging**: Log all tenant context switches
5. **Rate limiting**: Per-tenant API rate limits
6. **Database-level enforcement**: Consider PostgreSQL RLS

## 🛠️ Building & Installation

This PoC requires building the modified packages:

```bash
# Build the tenant module
cd packages/modules/tenant
yarn build

# Build core utils (for repository changes)
cd packages/core/utils
yarn build

# Build core types (for Context changes)
cd packages/core/types
yarn build

# Build medusa (for API routes)
cd packages/medusa
yarn build
```

## 🗄️ Database Migrations

**Note**: This PoC does NOT include migration scripts. For testing, you'll need to:

1. Manually add `tenant_id` columns to your test database:
   ```sql
   ALTER TABLE product ADD COLUMN tenant_id VARCHAR(255);
   ALTER TABLE customer ADD COLUMN tenant_id VARCHAR(255);
   ALTER TABLE "order" ADD COLUMN tenant_id VARCHAR(255);
   
   CREATE INDEX idx_product_tenant ON product(tenant_id);
   CREATE INDEX idx_customer_tenant ON customer(tenant_id);
   CREATE INDEX idx_order_tenant ON "order"(tenant_id);
   ```

2. Create the `tenant` table:
   ```sql
   CREATE TABLE tenant (
     id VARCHAR(255) PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     slug VARCHAR(255) NOT NULL UNIQUE,
     subdomain VARCHAR(255) UNIQUE,
     custom_domain VARCHAR(255) UNIQUE,
     status VARCHAR(50) NOT NULL DEFAULT 'active',
     default_currency_code VARCHAR(3) DEFAULT 'usd',
     default_region_id VARCHAR(255),
     metadata JSONB,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     deleted_at TIMESTAMP
   );
   ```

For a production implementation, proper migration scripts would be generated using MikroORM's migration tools.

## 📊 Test Coverage

The integration tests verify:

- ✅ Tenant CRUD operations
- ✅ Product isolation between tenants
- ✅ Customer isolation between tenants
- ✅ Cross-tenant access prevention
- ✅ Same email allowed across different tenants

Run tests:
```bash
cd packages/modules/tenant
yarn test:integration
```

## 🚧 Limitations & Future Work

### PoC Limitations

- Only 3 core entities have `tenant_id` (Product, Customer, Order)
- No database migrations included
- No authentication/authorization
- No admin UI for tenant management
- No subdomain routing (needs DNS/proxy configuration)
- No tenant-specific configuration (currencies, regions, etc.)

### Next Steps (from RFC Phase 2+)

1. **Complete Entity Coverage**: Add `tenant_id` to all 50+ entities
2. **Authentication Integration**: JWT with tenant_id claim
3. **User-Tenant Relationship**: Many-to-many with roles
4. **Tenant Lifecycle**: Onboarding, suspension, deletion workflows
5. **PostgreSQL RLS**: Database-enforced row-level security
6. **Admin UI**: Tenant management dashboard
7. **Multi-region**: Geographic tenant placement
8. **Billing Integration**: Subscription plans and usage tracking

## 📚 Additional Resources

- [RFC Document](RFC_MULTI_TENANCY.md) - Complete design and architecture
- [MikroORM Multi-Tenancy](https://mikro-orm.io/docs/recipes/multi-tenant-per-database) - ORM patterns
- [Shopify Sharding](https://shopify.engineering/sharding-at-shopify) - Scaling multi-tenancy
- [OWASP Multi-Tenancy](https://owasp.org/www-community/Multi-Tenancy_Security) - Security best practices

## 🤝 Contributing

This is a PoC/proof-of-concept. For production use:

1. Review the RFC thoroughly
2. Add comprehensive test coverage for all entities
3. Implement authentication and authorization
4. Create proper database migrations
5. Add observability and monitoring
6. Conduct security audit

## 📝 License

Same as Medusa core (MIT)

---

**Questions or feedback?** Open an issue or discussion on the main Medusa repository.
