/**
 * Certification Endpoint Tests
 * Tests for /api/certifications endpoints
 */

const request = require("supertest");
const mongoose = require("mongoose");
const User = require("../../models/mongo/User");
const CertificationRequest = require("../../models/mongo/CertificationRequest");
const certificationRoutes = require("../../routes/certificationRoutes");
const { createTestApp } = require("../helpers/testSetup");
const { clearMongoCollections } = require("../helpers/db");
const { HTTP_STATUS, API_ROUTES } = require("../helpers/testConstants");
const { createUser } = require("../factories/userFactory");
const { createCertification } = require("../factories/certificationFactory");

const app = createTestApp(API_ROUTES.CERTIFICATIONS, certificationRoutes);

describe("Certification API Endpoints", () => {
  let userId;
  let certificationId;

  beforeEach(async () => {
    await clearMongoCollections(CertificationRequest, User);

    // Create a test user
    const user = await createUser();
    userId = user._id;
  });

  describe("POST /api/certifications/apply", () => {
    it("should create a new certification request", async () => {
      const certData = {
        userId: userId,
        experience: "I have 5 years of experience with cloud architecture and DevOps",
        motivation: "I want to validate my expertise in AWS solutions architecture",
        techExpertise: ["AWS", "Docker", "Kubernetes"],
        cvUrl: "https://example.com/cv.pdf",
      };

      const response = await request(app)
        .post(`${API_ROUTES.CERTIFICATIONS}/apply`)
        .send(certData);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(response.body.request).toBeDefined();
    });

    it("should fail when missing required fields", async () => {
      const response = await request(app)
        .post(`${API_ROUTES.CERTIFICATIONS}/apply`)
        .send({ userId: userId });

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("GET /api/certifications", () => {
    it("should get all certification requests", async () => {
      await createCertification(userId, {
        experience: "I have 5 years of experience",
        motivation: "I want to validate my expertise",
        techExpertise: ["AWS", "Docker"],
      });

      const response = await request(app).get(API_ROUTES.CERTIFICATIONS);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.requests)).toBe(true);
      expect(response.body.requests.length).toBeGreaterThan(0);
    });

    it("should filter certifications by status", async () => {
      await createCertification(userId, {
        experience: "I have 5 years of experience",
        motivation: "I want to validate my expertise",
        techExpertise: ["AWS", "Docker"],
        status: "approved",
      });

      const response = await request(app)
        .get(API_ROUTES.CERTIFICATIONS)
        .query({ status: "approved" });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.requests)).toBe(true);
    });

    it("should filter certifications by userId", async () => {
      await createCertification(userId, {
        experience: "I have 5 years of experience",
        motivation: "I want to validate my expertise",
        techExpertise: ["AWS", "Docker"],
      });

      const response = await request(app)
        .get(API_ROUTES.CERTIFICATIONS)
        .query({ userId: userId.toString() });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.requests)).toBe(true);
    });
  });

  describe("GET /api/certifications/:certificationId", () => {
    it("should get certification by ID", async () => {
      const cert = await createCertification(userId, {
        experience: "I have 5 years of experience",
        motivation: "I want to validate my expertise",
        techExpertise: ["AWS", "Docker"],
      });

      const response = await request(app).get(`${API_ROUTES.CERTIFICATIONS}/${cert._id}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.request._id.toString()).toBe(cert._id.toString());
    });

    it("should return 404 for non-existent certification", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`${API_ROUTES.CERTIFICATIONS}/${fakeId}`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("PATCH /api/certifications/:certificationRequestId/approve", () => {
    it("should approve certification successfully", async () => {
      const cert = await createCertification(userId, {
        experience: "I have 5 years of experience",
        motivation: "I want to validate my expertise",
        techExpertise: ["AWS", "Docker"],
      });

      const response = await request(app)
        .patch(`${API_ROUTES.CERTIFICATIONS}/${cert._id}/approve`)
        .send({ adminNotes: "Looks good" });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.request.status).toBe("approved");
    });

    it("should return 404 for non-existent certification", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`${API_ROUTES.CERTIFICATIONS}/${fakeId}/approve`)
        .send({ adminNotes: "Approve anyway" });

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("PATCH /api/certifications/:certificationRequestId/reject", () => {
    it("should reject certification successfully", async () => {
      const cert = await createCertification(userId, {
        experience: "I have 5 years of experience",
        motivation: "I want to validate my expertise",
        techExpertise: ["AWS", "Docker"],
      });

      const response = await request(app)
        .patch(`${API_ROUTES.CERTIFICATIONS}/${cert._id}/reject`)
        .send({ adminNotes: "Not enough experience" });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.request.status).toBe("rejected");
    });

    it("should return 404 for non-existent certification", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`${API_ROUTES.CERTIFICATIONS}/${fakeId}/reject`)
        .send({ adminNotes: "Reject anyway" });

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  // No DELETE route for certifications in current API
});
