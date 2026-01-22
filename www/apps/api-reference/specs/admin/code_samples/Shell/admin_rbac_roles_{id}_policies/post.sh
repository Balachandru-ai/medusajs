curl -X POST '{backend_url}/admin/rbac/roles/{id}/policies' \
-H 'Authorization: Bearer {access_token}' \
-H 'Content-Type: application/json' \
--data-raw '{
  "policies": [
    "{value}"
  ]
}'