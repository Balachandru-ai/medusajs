---
"@medusajs/core-flows": patch
---

Add missing fields to productVariantsFields to fix an issue where variants without inventory management were not marked as requires_shipping from draft orders, even though they did require shipping.
