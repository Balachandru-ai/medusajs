# Medusa Core

Open-source commerce platform. TypeScript monorepo with 30+ modular commerce packages.

### 1. Codebase Structure

**Monorepo Organization:**
```
/packages/
├── medusa/              # Main Medusa package
├── core/                # Core framework packages
│   ├── framework/       # Core runtime
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Utilities
│   ├── workflows-sdk/   # Workflow composition
│   ├── core-flows/      # Predefined workflows
│   └── modules-sdk/     # Module development
├── modules/             # 30+ commerce modules
│   ├── product/, order/, cart/, payment/...
│   └── providers/       # 15+ provider implementations
├── admin/               # Dashboard packages
│   └── dashboard/       # React admin UI
├── cli/                 # CLI tools
└── design-system/       # UI components
/integration-tests/      # Full-stack tests
/www/                    # Documentation site
```

**Key Directories:**
- `packages/core/framework/` - Core runtime, HTTP, database
- `packages/medusa/src/api/` - API routes
- `packages/modules/` - Commerce feature modules
- `packages/admin/dashboard/` - Admin React app

### 2. Build System & Commands

**Package Manager**: Yarn 3.2.1 with node-modules linker

**Essential Commands:**
```bash
# Install dependencies
yarn install
# Build all packages
yarn build
# Build specific package
yarn workspace @medusajs/medusa build
# Watch mode (in package directory)
yarn watch
```

**Testing Commands:**
```bash
# All unit tests
yarn test
# Package integration tests
yarn test:integration:packages
# HTTP integration tests
yarn test:integration:http
# API integration tests
yarn test:integration:api
# Module integration tests
yarn test:integration:modules
```

### 3. Testing Conventions

**Frameworks:**
- Jest 29.7.0 (backend/core)
- Vitest 3.0.5 (admin/frontend)

**Test Locations:**
- Unit tests: `__tests__/` directories alongside source
- Package integration tests: `packages/*/integration-tests/__tests__/`
- HTTP integration tests: `integration-tests/http/__tests__/`

**Patterns:**
- File extension: `.spec.ts` or `.test.ts`
- Unit test structure: `describe/it` blocks
- Integration tests: Use custom test runners with DB setup

### 4. Code Style Conventions

**Formatting (Prettier):**
- No semicolons
- Double quotes
- 2 space indentation
- ES5 trailing commas
- Always use parens in arrow functions

**TypeScript:**
- Target: ES2021
- Module: Node16
- Strict null checks enabled
- Decorators enabled (experimental)

**Naming Conventions:**
- Files: kebab-case (`define-config.ts`)
- Types/Interfaces/Classes: PascalCase
- Functions/Variables: camelCase
- Constants: SCREAMING_SNAKE_CASE
- DB fields: snake_case

**Export Patterns:**
- Barrel exports via `export * from`
- Named re-exports for specific items
