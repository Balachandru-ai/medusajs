---
"@medusajs/dashboard": patch
---

fix(dashboard): pass product ID explicitly to edit option form

The edit product option form was using `option.product_id` which is undefined when options are fetched as part of a product response. Now passes the product ID from the parent component via props.
