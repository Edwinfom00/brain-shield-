import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Dev  → DATABASE_URL="file:./dev.db"       (SQLite, .env.local)
// Prod → DATABASE_URL="postgresql://..."    (Supabase, env vars sur Vercel/Railway)

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL']!,
  },
});
