import { QueryBuilder } from "../query-builder"
import { Knex } from "@mikro-orm/knex"
import { IndexTypes } from "@medusajs/framework/types"

// Mock knex instance for testing
const createMockKnex = () => {
  const mockQueryBuilder = {
    distinct: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    joinRaw: jest.fn().mockReturnThis(),
    whereRaw: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    orderByRaw: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    clearSelect: jest.fn().mockReturnThis(),
    clearOrder: jest.fn().mockReturnThis(),
    clearCounters: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    toQuery: jest.fn().mockReturnValue("SELECT * FROM test"),
    raw: jest.fn((sql, bindings) => ({ sql, bindings })),
  }

  const mockKnex = {
    queryBuilder: jest.fn(() => mockQueryBuilder), // This returns our mockQueryBuilder
    raw: jest.fn((sql, bindings) => ({ sql, bindings, toQuery: () => `${sql} ${JSON.stringify(bindings || [])}` })),
  } as unknown as Knex

  return { mockKnex, mockQueryBuilder }
}

describe("QueryBuilder SQL Generation", () => {
  let mockKnex: Knex
  let mockQueryBuilder: any
  let mockSchema: IndexTypes.SchemaObjectRepresentation
  let mockEntityMap: Record<string, any>

  beforeEach(() => {
    const mocks = createMockKnex()
    mockKnex = mocks.mockKnex
    mockQueryBuilder = mocks.mockQueryBuilder
    
    // Reset all mock calls before each test
    jest.clearAllMocks()

    // Mock module config
    const mockModuleConfig = {
      serviceName: "ProductService",
      schema: `type Product { id: ID! title: String! status: String! }`,
      alias: [
        {
          name: "product",
          entity: "Product",
        },
      ],
    }

    // Mock schema for Product entity
    mockSchema = {
      Product: {
        entity: "Product",
        parents: [],
        alias: "product",
        listeners: [],
        moduleConfig: mockModuleConfig,
        fields: ["id", "title", "status"],
      },
      _schemaPropertiesMap: {
        product: {
          isInverse: false,
          isList: false,
          ref: {
            entity: "Product",
            parents: [],
            alias: "product",
            listeners: [],
            moduleConfig: mockModuleConfig,
            fields: ["id", "title", "status"],
          },
        },
      },
      _serviceNameModuleConfigMap: {
        ProductService: mockModuleConfig,
      },
    }

    // Mock entity map for GraphQL type checking
    mockEntityMap = {
      Product: {
        name: "Product",
        _fields: {
          id: {
            name: "id",
            type: { toString: () => "ID!" }
          },
          title: {
            name: "title",
            type: { toString: () => "String!" }
          },
          status: {
            name: "status",
            type: { toString: () => "String!" }
          },
        },
      },
    }

    // Create a basic QueryBuilder instance to initialize the class
    new QueryBuilder({
      schema: mockSchema,
      entityMap: mockEntityMap,
      knex: mockKnex,
      selector: {
        select: {
          product: {
            id: true,
            title: true,
            status: true,
          },
        },
        where: {},
      },
      requestedFields: {
        product: {
          id: true,
          title: true,
          status: true,
        },
      },
    }).buildQuery({ hasPagination: false, hasCount: false })
  })

  describe("Mock verification", () => {
    it("should verify that mockQueryBuilder is used by QueryBuilder class", () => {
      const selector = {
        select: { product: { id: true } },
        where: { "product.id": { $in: ["test"] } },
      }

      new QueryBuilder({
        schema: mockSchema,
        entityMap: mockEntityMap,
        knex: mockKnex,
        selector,
        requestedFields: selector.select,
      }).buildQuery({ hasPagination: false, hasCount: false })

      // Verify that our mocked knex.queryBuilder was called
      expect(mockKnex.queryBuilder).toHaveBeenCalled()
      
      // Verify that our mockQueryBuilder.whereRaw was called
      expect(mockQueryBuilder.whereRaw).toHaveBeenCalled()
    })
  })

  describe("$in operator", () => {
    it("should generate correct SQL for $in on id field", () => {
      const selector = {
        select: {
          product: {
            id: true,
          },
        },
        where: {
          "product.id": {
            $in: ["prod1", "prod2", "prod3"]
          }
        },
      }

      new QueryBuilder({
        schema: mockSchema,
        entityMap: mockEntityMap,
        knex: mockKnex,
        selector,
        requestedFields: selector.select,
      }).buildQuery({ hasPagination: false, hasCount: false })

      // Verify whereRaw was called with correct parameters for IN operator
      expect(mockQueryBuilder.whereRaw).toHaveBeenCalledWith(
        expect.stringMatching(/id IN \(\?,\s*\?,\s*\?\)/),
        ["prod1", "prod2", "prod3"]
      )
    })

    it("should generate correct SQL for $in on JSON field", () => {
      const selector = {
        select: {
          product: {
            id: true,
            status: true,
          },
        },
        where: {
          "product.status": {
            $in: ["published", "draft"]
          }
        },
      }

      new QueryBuilder({
        schema: mockSchema,
        entityMap: mockEntityMap,
        knex: mockKnex,
        selector,
        requestedFields: selector.select,
      }).buildQuery({ hasPagination: false, hasCount: false })

      // Verify whereRaw was called with correct parameters for IN operator on JSON field
      expect(mockQueryBuilder.whereRaw).toHaveBeenCalledWith(
        expect.stringMatching(/@> ANY\(ARRAY\[\?,\s*\?\]::JSONB\[\]\)/),
        expect.arrayContaining([
          expect.stringContaining('"status":"published"'),
          expect.stringContaining('"status":"draft"')
        ])
      )
    })
  })

  describe("$nin operator", () => {
    it("should generate correct SQL for $nin on id field (not wrapped in JSON)", () => {
      const selector = {
        select: {
          product: {
            id: true,
          },
        },
        where: {
          "product.id": {
            $nin: ["prod1", "prod2", "prod3"]
          }
        },
      }

      new QueryBuilder({
        schema: mockSchema,
        entityMap: mockEntityMap,
        knex: mockKnex,
        selector,
        requestedFields: selector.select,
      }).buildQuery({ hasPagination: false, hasCount: false })

      // Verify whereRaw was called with correct parameters for NOT IN operator
      expect(mockQueryBuilder.whereRaw).toHaveBeenCalledWith(
        expect.stringMatching(/id NOT IN \(\?,\s*\?,\s*\?\)/),
        ["prod1", "prod2", "prod3"] // Should be array, not nested array or JSON string
      )

      // Verify it's NOT called with JSON-wrapped values
      expect(mockQueryBuilder.whereRaw).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('{"prod1","prod2","prod3"}')
      )

      // Verify it's NOT called with nested arrays
      expect(mockQueryBuilder.whereRaw).not.toHaveBeenCalledWith(
        expect.anything(),
        [["prod1", "prod2", "prod3"]]
      )
    })

    it("should generate correct SQL for $nin on JSON field using JSON path", () => {
      const selector = {
        select: {
          product: {
            id: true,
            status: true,
          },
        },
        where: {
          "product.status": {
            $nin: ["published", "draft"]
          }
        },
      }

      new QueryBuilder({
        schema: mockSchema,
        entityMap: mockEntityMap,
        knex: mockKnex,
        selector,
        requestedFields: selector.select,
      }).buildQuery({ hasPagination: false, hasCount: false })

      // Verify whereRaw was called with correct JSON path query for NOT IN operator
      expect(mockQueryBuilder.whereRaw).toHaveBeenCalledWith(
        expect.stringContaining("@@ ?"),
        '$.status NOT IN ("published","draft")'
      )

      // Verify it's NOT called with JSON-wrapped array
      expect(mockQueryBuilder.whereRaw).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining(['$.status NOT IN ("published","draft")'])
      )
    })
  })

  describe("Regression test: $nin should not create nested arrays", () => {
    it("should not pass nested arrays or JSON strings to whereRaw for $nin", () => {
      const testValues = ["prod1", "prod2", "prod3"]
      
      const ninSelector = {
        select: { product: { id: true } },
        where: { "product.id": { $nin: testValues } },
      }

      new QueryBuilder({
        schema: mockSchema,
        entityMap: mockEntityMap,
        knex: mockKnex,
        selector: ninSelector,
        requestedFields: ninSelector.select,
      }).buildQuery({ hasPagination: false, hasCount: false })

      // Verify whereRaw was never called with problematic parameter formats
      const allCalls = mockQueryBuilder.whereRaw.mock.calls
      
      allCalls.forEach(call => {
        const [sql, params] = call
        if (sql.includes("NOT IN")) {
          // Should not receive nested array
          expect(params).not.toEqual([testValues])
          
          // Should not receive JSON string containing array
          if (typeof params === 'string') {
            expect(params).not.toMatch(/\{.*prod1.*prod2.*prod3.*\}/)
          }
          
          // Should receive flat array
          expect(Array.isArray(params)).toBe(true)
          expect(params).toEqual(testValues)
        }
      })
    })
  })
})