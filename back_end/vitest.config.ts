import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.ts"],
    environment: "node",
    env: {
      // Tests never touch the DB (Prisma is mocked in integration tests); a
      // dummy URL keeps PrismaClient construction happy.
      DATABASE_URL: "postgresql://ci:ci@localhost:5432/ci",
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      // Throwaway secrets: util/jwt.ts and services/authService.ts refuse to
      // load without them.
      AUTH_SECRET: "test-auth-secret",
      AUTH_REFRESH_SECRET: "test-refresh-secret",
      RESET_SECRET: "test-reset-secret",
      EMAIL_VERIFY_SECRET: "test-email-verify-secret",
      RESET_PASSWORD_SECRET: "test-reset-password-secret",
    },
  },
});
