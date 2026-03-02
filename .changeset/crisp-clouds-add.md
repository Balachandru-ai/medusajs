---
"@medusajs/medusa": major
---

Added process.execPath to always have the correct node executable path, so that npx medusa plugin:develop does not fail ensuring cross-platform compatibility.
