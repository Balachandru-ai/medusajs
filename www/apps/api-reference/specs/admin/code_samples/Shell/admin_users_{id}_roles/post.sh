curl -X POST '{backend_url}/admin/users/{id}/roles' \
-H 'Authorization: Bearer {access_token}' \
-H 'Content-Type: application/json' \
--data-raw '{
  "roles": [
    "{value}"
  ]
}'