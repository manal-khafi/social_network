#!/bin/sh
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-postgres}"

echo "Waiting for Postgres at ${DB_HOST}:${DB_PORT} ..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; do
  sleep 2
done
echo "Postgres is ready."

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Ensuring system roles exist..."
npm run seed:roles || echo "WARNING: role seed failed, continuing startup."

exec "$@"
