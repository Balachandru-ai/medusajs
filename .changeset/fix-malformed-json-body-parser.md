---
"@medusajs/framework": patch
---

fix: return HTTP 400 for malformed JSON request bodies instead of 500

Express body-parser throws a `SyntaxError` with type `entity.parse.failed` when the request body contains invalid JSON. The error handler did not match this error type, causing it to fall through to the default 500 handler. This patch catches the body-parser `SyntaxError` early and returns a proper `400` with type `invalid_data`.
