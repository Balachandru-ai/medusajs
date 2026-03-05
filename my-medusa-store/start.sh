#!/bin/sh
set -e

echo "Running database migrations..."
yarn medusa db:migrate

# seed only once using a marker file stored in the project folder
SEED_MARKER="/server/.seeded"

if [ ! -f "$SEED_MARKER" ]; then
  echo "Seeding database (first time only)..."
  yarn seed && touch "$SEED_MARKER" || echo "Seed failed, continuing..."
else
  echo "Skipping seed (already seeded)"
fi

echo "Starting Medusa development server..."
yarn dev
