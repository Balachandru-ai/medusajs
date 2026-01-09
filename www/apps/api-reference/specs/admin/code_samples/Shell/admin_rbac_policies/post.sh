curl -X POST '{backend_url}/admin/rbac/policies' \
-H 'Authorization: Bearer {access_token}' \
-H 'Content-Type: application/json' \
--data-raw '{
  "key": "{value}",
  "resource": "{value}",
  "operation": "{value}"
}'