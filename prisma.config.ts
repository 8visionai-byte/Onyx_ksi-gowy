import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
