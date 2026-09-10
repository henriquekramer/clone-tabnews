import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/status`);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      const dbOpenedConnections =
        responseBody.dependencies.database.opened_connections;

      expect(response.status).toBe(200);
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
      expect(dbOpenedConnections).toEqual(1);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
    });
  });

  describe("Privileged user", () => {
    test("With `read:status:all`", async () => {
      const privilegedUser = await orchestrator.createUser();
      const activatedPrivilegedUser =
        await orchestrator.activateUser(privilegedUser);
      await orchestrator.addFeaturesToUser(activatedPrivilegedUser, [
        "read:status:all",
      ]);
      const privilegedUserSession = await orchestrator.createSession(
        activatedPrivilegedUser,
      );

      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          Cookie: `session_id=${privilegedUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      const dbOpenedConnections =
        responseBody.dependencies.database.opened_connections;

      expect(response.status).toBe(200);
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
      expect(dbOpenedConnections).toEqual(1);
      expect(responseBody.dependencies.database.version).toEqual("16.0");
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
    });
  });
});
