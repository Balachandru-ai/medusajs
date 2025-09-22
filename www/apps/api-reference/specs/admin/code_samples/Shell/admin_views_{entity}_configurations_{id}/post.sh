curl -X POST '{backend_url}/admin/views/{entity}/configurations/{id}' \
-H 'Authorization: Bearer {access_token}' \
-H 'Content-Type: application/json' \
-d '{
  "is_system_default": true
}'