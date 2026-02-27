curl -X POST '{backend_url}/admin/rbac/roles/{id}/users' \
-H 'Authorization: Bearer {access_token}' \
-H 'Content-Type: application/json' \
--data-raw '{
  "users": [
    "{value}"
  ]
}'