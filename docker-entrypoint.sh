#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set"
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

echo "Starting Next.js server..."
node server.js
