import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npm run seed'
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/svatba?schema=public'
  }
});
