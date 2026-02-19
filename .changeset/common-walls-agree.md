---
"@medusajs/payment-stripe": patch
---

Modify the `deleteAccountHolder` implementation for the Stripe payment provider to prevent the permanent deletion of the underlying Stripe customer. 