curl -X POST '{backend_url}/admin/rbac/roles' \
-H 'Authorization: Bearer {access_token}' \
-H 'Content-Type: application/json' \
--data-raw '{
  "name": "Connie"
}'