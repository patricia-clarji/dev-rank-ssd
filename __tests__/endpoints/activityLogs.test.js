/**
 * Activity Log Endpoint Tests
 * Tests for /api/logs endpoints
 */

const request = require("supertest");
const ActivityLog = require("../../models/sql/ActivityLog");
const activityLogRoutes = require("../../routes/activityLogRoutes");
const { createTestApp } = require("../helpers/testSetup");
const { clearSQLTable } = require("../helpers/db");
const { HTTP_STATUS, API_ROUTES } = require("../helpers/testConstants");
const {
  createActivityLog,
  createActivityLogs,
  createOldActivityLog,
} = require("../factories/activityLogFactory");
const { LOG_ACTIONS, LOG_ENTITIES } = require("../../constants/activityLogEnums");

const app = createTestApp(API_ROUTES.ACTIVITY_LOGS, activityLogRoutes);

describe("Activity Log Endpoint Tests", () => {
  beforeEach(async () => {
    await clearSQLTable(ActivityLog);
  });

  describe("GET /api/logs", () => {
    it("should get all activity logs", async () => {
      await createActivityLog({
        userId: "user123",
        action: LOG_ACTIONS.CREATE_PROJECT,
        entity: LOG_ENTITIES.PROJECT,
        entityId: "proj123",
      });

      const response = await request(app).get(API_ROUTES.ACTIVITY_LOGS);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should return empty array when no logs exist", async () => {
      const response = await request(app).get(API_ROUTES.ACTIVITY_LOGS);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /api/logs/user/:userId", () => {
    it("should get logs by user ID", async () => {
      const userId = "user123";
      await createActivityLog({ userId });

      const response = await request(app).get(`${API_ROUTES.ACTIVITY_LOGS}/user/${userId}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should return empty array for user with no logs", async () => {
      const response = await request(app).get(`${API_ROUTES.ACTIVITY_LOGS}/user/nonexistent`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /api/logs/entity/:entity", () => {
    it("should get logs by entity type", async () => {
      await createActivityLog({
        entity: LOG_ENTITIES.PROJECT,
      });

      const response = await request(app).get(`${API_ROUTES.ACTIVITY_LOGS}/entity/project`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return empty array for entity type with no logs", async () => {
      //TODO check
      const response = await request(app).get(`${API_ROUTES.ACTIVITY_LOGS}/entity/certification`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /api/logs/entity/:entity/:entityId", () => {
    it("should get logs for specific entity record", async () => {
      const entityId = "proj123";
      await createActivityLog({ entityId });

      const response = await request(app).get(
        `${API_ROUTES.ACTIVITY_LOGS}/entity/project/${entityId}`
      );

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return empty array for non-existent entity record", async () => {
      const response = await request(app).get(
        `${API_ROUTES.ACTIVITY_LOGS}/entity/project/nonexistent`
      );

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body).toEqual([]);
    });
  });

  describe("DELETE /api/logs/old", () => {
    it("should delete logs older than specified date", async () => {
      const oldDate = await createOldActivityLog(10);

      const response = await request(app)
        .delete(`${API_ROUTES.ACTIVITY_LOGS}/old`)
        .query({ beforeDate: oldDate.timestamp.toISOString().split("T")[0] });

      expect(response.status).toBe(HTTP_STATUS.OK);
    });

    it("should return 400 if beforeDate is missing", async () => {
      const response = await request(app).delete(`${API_ROUTES.ACTIVITY_LOGS}/old`);

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("DELETE /api/logs", () => {
    it("should delete all logs", async () => {
      await createActivityLog();

      const response = await request(app).delete(API_ROUTES.ACTIVITY_LOGS);

      expect(response.status).toBe(HTTP_STATUS.OK);

      const checkRes = await request(app).get(API_ROUTES.ACTIVITY_LOGS);
      expect(checkRes.body).toEqual([]);
    });

    it("should handle deletion when no logs exist", async () => {
      const response = await request(app).delete(API_ROUTES.ACTIVITY_LOGS);

      expect(response.status).toBe(HTTP_STATUS.OK);
    });
  });
});
