import database from "infra/database.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await cleanDatabase();
});

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function getMigrationsResponse(method) {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method,
  });
  return response;
}

async function getDataBaseStatus() {
  const response = await fetch("http://localhost:3000/api/v1/status");
  return await response.json();
}

describe("OTHER HTTP METHODS /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Ensuring there are no open connections to the database", async () => {
      for (let method of ["HEAD", "PUT", "DELETE", "OPTIONS", "PATCH"]) {
        await cleanDatabase();

        const migrationsResponse = await getMigrationsResponse(method);
        expect(migrationsResponse.status).toBe(405);

        const status = await getDataBaseStatus();
        expect(status.dependencies.database.opened_connections).toEqual(1);
      }
    });
  });
});
