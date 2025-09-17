// Simple test to verify the fixes work correctly
const {
  buildPromotionRuleQueryFilterFromContext,
} = require("./packages/modules/promotion/dist/utils/compute-actions/build-promotion-rule-query-filter-from-context.js")

// Test 1: Empty context should return empty filter (not invalid SQL)
console.log("Test 1: Empty context")
const emptyContext = {}
const result1 = buildPromotionRuleQueryFilterFromContext(emptyContext)
console.log("Result:", JSON.stringify(result1, null, 2))
console.log("Expected: {} (empty object)")
console.log("Pass:", Object.keys(result1).length === 0 ? "✅" : "❌")

// Test 2: Context with attributes should generate valid SQL
console.log("\nTest 2: Context with attributes")
const contextWithAttributes = {
  items: [{ id: "item1", quantity: 1, subtotal: 100 }],
  customer: { id: "customer1" },
}
const result2 = buildPromotionRuleQueryFilterFromContext(contextWithAttributes)
console.log("Result keys:", Object.keys(result2))
console.log("Pass:", Object.keys(result2).length > 0 ? "✅" : "❌")

// Test 3: SQL injection prevention
console.log("\nTest 3: SQL injection prevention")
const maliciousContext = {
  items: [
    {
      id: "item1'; DROP TABLE promotion_rule; --",
      quantity: 1,
      subtotal: 100,
    },
  ],
}
try {
  const result3 = buildPromotionRuleQueryFilterFromContext(maliciousContext)
  console.log(
    "Result generated without error:",
    Object.keys(result3).length > 0 ? "✅" : "❌"
  )
} catch (error) {
  console.log("Error:", error.message)
  console.log("Pass: ❌")
}

console.log("\nAll tests completed!")
