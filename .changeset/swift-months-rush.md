---
"@medusajs/event-bus-redis": patch
"@medusajs/core-flows": patch
---

feat(events): Implement priority-based event processing

- Internal events default to lowest priority (2,097,152) to prevent queue overload
- Normal events default to priority 100
- Order placed events explicitly set to priority 10 for immediate processing
- Support for priority overrides at message, emit, and module levels
