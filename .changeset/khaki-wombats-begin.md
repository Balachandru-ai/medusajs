---
"@medusajs/dashboard": patch
---

fix(dashboard): settingsRoutes from multiple plugins only show the first one

Previously, when multiple plugins registered settings routes, only the first plugin's routes were displayed. This fix uses `flatMap` to properly merge all settings routes from all plugins.
