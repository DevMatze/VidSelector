#!/bin/sh
set -eu

echo "Creating a pre-migration backup when a database exists..."
./node_modules/.bin/tsx scripts/backup-database.ts --migration

echo "Applying database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Starting VidSelector..."
exec node scripts/run-server.mjs start
