import { defineConfig } from "vitest/config";

// Two groups:
//  - unit:        no database; pure logic and the app's HTTP layer.
//  - integration: real MySQL (DB_* in .env.test); the database is created and
//                 migrated once before the run, and files run one at a time
//                 because they share it.
export default defineConfig({
  test: {
    env: { NODE_ENV: "test" },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.js"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.js"],
          globalSetup: ["tests/integration/globalSetup.js"],
          fileParallelism: false,
        },
      },
    ],
  },
});
