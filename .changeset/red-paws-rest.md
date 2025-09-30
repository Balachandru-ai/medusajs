---
"@medusajs/core-flows": patch
---

Move cart complete order placed event later in the workflow, to stop the event being emitted when payment fails and the workflow is reverted
