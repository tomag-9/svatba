#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set"
  exit 1
fi

echo "Applying Prisma schema..."
./node_modules/.bin/prisma db push --schema=/app/prisma/schema.prisma

echo "Checking whether seed is needed..."
node - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const { spawnSync } = require('child_process');
const prisma = new PrismaClient();

(async () => {
  const taskCount = await prisma.task.count();
  await prisma.$disconnect();

  if (taskCount === 0) {
    console.log('No tasks found, seeding initial data...');
    const result = spawnSync('node', ['prisma/seed.js'], { stdio: 'inherit' });
    if (result.status !== 0) {
      process.exit(result.status || 1);
    }
  } else {
    console.log('Existing tasks detected, skipping seed.');
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
NODE

echo "Starting internal noon push scheduler..."
(
  LAST_NOON_PUSH_DATE=""
  while true; do
    CURRENT_TIME="$(date +%H:%M)"
    CURRENT_DATE="$(date +%F)"
    if [ "$CURRENT_TIME" = "12:00" ] && [ "$LAST_NOON_PUSH_DATE" != "$CURRENT_DATE" ]; then
      if wget -qO- --header="Authorization: Bearer $INTERNAL_PUSH_SECRET" --post-data='' http://127.0.0.1:3000/api/push/noon >/dev/null 2>&1; then
        LAST_NOON_PUSH_DATE="$CURRENT_DATE"
      fi
    fi
    sleep 30
  done
) &

echo "Starting Next.js server..."
./node_modules/.bin/next start
