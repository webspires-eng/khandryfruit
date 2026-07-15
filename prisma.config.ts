import "dotenv/config";

import { defineConfig } from "prisma/config";

const buildTimeDatabaseUrl =
  "postgresql://build:build@127.0.0.1:5432/build";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma client generation does not need a live database. Runtime access
    // and migration commands still fail safely unless a real URL is supplied.
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      buildTimeDatabaseUrl,
  },
});
