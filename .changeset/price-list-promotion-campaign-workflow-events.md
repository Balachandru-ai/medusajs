---
"@medusajs/utils": patch
"@medusajs/core-flows": patch
---

feat: emit workflow events for price lists, promotions, and campaigns (Omnibus)

Add workflow event constants and emit events from create/update/delete (and related) workflows for price lists, promotions, and campaigns to support Omnibus-compliant behaviour (e.g. lowest price in 30 days).
