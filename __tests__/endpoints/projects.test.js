/**
 * Project Endpoint Tests
 * Tests for /api/projects endpoints
 */

const request = require("supertest");
const mongoose = require("mongoose");
const User = require("../../models/mongo/User");
const Project = require("../../models/mongo/Project");
const projectRoutes = require("../../routes/projectRoutes");
const { createTestApp } = require("../helpers/testSetup");
const { clearMongoCollections } = require("../helpers/db");
const { HTTP_STATUS, API_ROUTES } = require("../helpers/testConstants");
const { createUser } = require("../factories/userFactory");
const { createProject, createProjects } = require("../factories/projectFactory");

const app = createTestApp(API_ROUTES.PROJECTS, projectRoutes);

describe("Project API Endpoints", () => {
  let userId;
  let projectId;

  beforeEach(async () => {
    await clearMongoCollections(Project, User);

    // Create a test user first
    const user = await createUser();
    userId = user._id;
  });

  describe("POST /api/projects", () => {
    it("should create a new project", async () => {
      const projectData = {
        title: "New Project",
        description: "A comprehensive test project description",
        techStack: ["Node.js", "Express"],
        status: "seeking-review",
        repoUrl: "https://github.com/test/project",
        userId: userId,
      };

      const response = await request(app)
        .post(API_ROUTES.PROJECTS)
        .send(projectData);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(response.body.project).toBeDefined();
      expect(response.body.project.title).toBe(projectData.title);
      projectId = response.body.project._id;
    });

    it("should fail when missing required fields", async () => {
      const response = await request(app)
        .post(API_ROUTES.PROJECTS)
        .send({ title: "Test" });

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("GET /api/projects", () => {
    it("should get all projects", async () => {
      await createProject({ user: userId });

      const response = await request(app).get(API_ROUTES.PROJECTS);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.projects.length).toBeGreaterThan(0);
    });

    it("should filter projects by status", async () => {
      await createProject({ user: userId, status: "seeking-review" });

      const response = await request(app)
        .get(API_ROUTES.PROJECTS)
        .query({ status: "seeking-review" });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.projects)).toBe(true);
    });

    it("should filter projects by userId", async () => {
      await createProject({ user: userId });

      const response = await request(app)
        .get(API_ROUTES.PROJECTS)
        .query({ userId: userId.toString() });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.projects)).toBe(true);
    });
  });

  describe("GET /api/projects/title/:title", () => {
    it("should get project by title", async () => {
      const project = await createProject({ user: userId, title: "Unique Project" });

      const response = await request(app).get(`${API_ROUTES.PROJECTS}/title/${project.title}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.project.title).toBe(project.title);
    });

    it("should return 404 for non-existent project", async () => {
      const response = await request(app).get(`${API_ROUTES.PROJECTS}/title/NonExistent`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("GET /api/projects/user/:userId", () => {
    it("should get projects by user", async () => {
      await createProject({ user: userId });

      const response = await request(app).get(`${API_ROUTES.PROJECTS}/user/${userId}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.projects)).toBe(true);
    });
  });

  describe("GET /api/projects/:projectId", () => {
    it("should get project by ID", async () => {
      const project = await createProject({ user: userId });

      const response = await request(app).get(`${API_ROUTES.PROJECTS}/${project._id}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.project._id.toString()).toBe(project._id.toString());
    });

    it("should return 404 for invalid project ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`${API_ROUTES.PROJECTS}/${fakeId}`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("PUT /api/projects/:projectId", () => {
    it("should update project successfully", async () => {
      const project = await createProject({ user: userId });

      const response = await request(app)
        .put(`${API_ROUTES.PROJECTS}/${project._id}`)
        .send({
          description: "Updated description for long enough content to pass validation",
          status: "reviewed",
        });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.project.status).toBe("reviewed");
    });

    it("should return 404 for non-existent project", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`${API_ROUTES.PROJECTS}/${fakeId}`)
        .send({
          description: "Updated description for long enough content to pass validation",
        });

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("DELETE /api/projects/:projectId", () => {
    it("should delete project successfully", async () => {
      const project = await createProject({ user: userId });

      const response = await request(app).delete(`${API_ROUTES.PROJECTS}/${project._id}`);

      expect(response.status).toBe(HTTP_STATUS.OK);

      const checkRes = await request(app).get(`${API_ROUTES.PROJECTS}/${project._id}`);
      expect(checkRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it("should remove deleted project from all users' projects arrays if referenced", async () => {
      // Create project and user with unique email
      const project = await createProject({ user: userId });
      const userFactory = require("../factories/userFactory");
      const uniqueEmail = `test+${Date.now()}@test.com`;
      const user = await userFactory.createUser({ email: uniqueEmail });
      // Simulate project assignment
      user.projects = [project._id];
      await user.save();
      // Delete project
      await request(app).delete(`${API_ROUTES.PROJECTS}/${project._id}`);
      // Check user no longer has the project
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.projects ? updatedUser.projects.map(String) : []).not.toContain(project._id.toString());
    });

    it("should return 404 for non-existent project", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`${API_ROUTES.PROJECTS}/${fakeId}`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("GET /api/projects/:projectId/reviews", () => {
    it("should get project reviews", async () => {
      const project = await createProject({ user: userId });
      // Create a user to act as reviewer
      const reviewer = await createUser({ email: "reviewer2@test.com" });
      // Create a review for this project
      await require("../factories/reviewFactory").createReview({
        reviewer: reviewer._id,
        project: project._id
      });
      const response = await request(app).get(`${API_ROUTES.PROJECTS}/${project._id}/reviews`);
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});
