import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.ts"],
    environment: "node",
    // Unit tests don't touch the DB; a dummy URL keeps PrismaClient construction happy.
    env: { DATABASE_URL: "postgresql://ci:ci@localhost:5432/ci" },
  },
});
