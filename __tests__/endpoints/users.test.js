/**
 * User Endpoint Tests
 * Tests for /api/users endpoints
 */

const request = require("supertest");
const mongoose = require("mongoose");
const User = require("../../models/mongo/User");
const Skill = require("../../models/mongo/Skill");
const userRoutes = require("../../routes/userRoutes");
const { createTestApp } = require("../helpers/testSetup");
const { clearMongoCollections } = require("../helpers/db");
const { HTTP_STATUS, API_ROUTES } = require("../helpers/testConstants");
const { createUser, createUsers } = require("../factories/userFactory");
const { createSkills } = require("../factories/skillFactory");

const app = createTestApp(API_ROUTES.USERS, userRoutes);

describe("User API Endpoints", () => {
  let userId;
  let userId2;

  beforeEach(async () => {
    // Clear users, skills collections
    await clearMongoCollections(User, Skill);
  });
  describe("DELETE /api/users/:id/skills", () => {
    it("should remove multiple skills from user", async () => {
      const user = await createUser();
      const skills = await createSkills(2);
      // Add both skills to user
      await request(app)
        .post(`${API_ROUTES.USERS}/${user._id}/skills`)
        .send({ skills: skills.map(s => s._id.toString()) });

      // Remove both skills
      const response = await request(app)
        .delete(`${API_ROUTES.USERS}/${user._id}/skills`)
        .send({ skills: skills.map(s => s._id.toString()) });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.user.skills.length).toBe(0);
      expect(response.body.message).toMatch(/removed successfully/);
    });
  });

  describe("POST /api/users/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "New User",
        email: "newuser@test.com",
        password: "password123",
        bio: "Test bio",
      };

      const response = await request(app)
        .post(`${API_ROUTES.USERS}/register`)
        .send(userData);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      userId = response.body.user._id;
    });

    it("should fail when email already exists", async () => {
      const userData = {
        name: "Duplicate User",
        email: "duplicate@test.com",
        password: "password123",
        bio: "Test bio",
      };

      await request(app)
        .post(`${API_ROUTES.USERS}/register`)
        .send(userData);

      const response = await request(app)
        .post(`${API_ROUTES.USERS}/register`)
        .send(userData);

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    });

    it("should fail when missing required fields", async () => {
      const response = await request(app)
        .post(`${API_ROUTES.USERS}/register`)
        .send({ name: "Test User" });

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("GET /api/users", () => {
    it("should get all users", async () => {
      await createUsers(2);

      const response = await request(app).get(API_ROUTES.USERS);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBe(2);
    });

    it("should return empty array when no users exist", async () => {
      const response = await request(app).get(API_ROUTES.USERS);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.users).toEqual([]);
    });
  });

  describe("GET /api/users/name/:name", () => {
    it("should get user by name", async () => {
      const user = await createUser({
        name: "Unique User",
        email: "unique@test.com",
      });

      const response = await request(app).get(`${API_ROUTES.USERS}/name/${user.name}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.user.name).toBe(user.name);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app).get(`${API_ROUTES.USERS}/name/NonExistent`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should get user by ID", async () => {
      const user = await createUser();

      const response = await request(app).get(`${API_ROUTES.USERS}/${user._id}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.user._id).toBe(user._id.toString());
    });

    it("should return 404 for invalid user ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`${API_ROUTES.USERS}/${fakeId}`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update user successfully", async () => {
      const user = await createUser();

      const response = await request(app)
        .put(`${API_ROUTES.USERS}/${user._id}`)
        .send({ bio: "Updated bio" });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.user.bio).toBe("Updated bio");
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`${API_ROUTES.USERS}/${fakeId}`)
        .send({ bio: "Updated" });

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete user successfully", async () => {
      const user = await createUser();

      const response = await request(app).delete(`${API_ROUTES.USERS}/${user._id}`);

      expect(response.status).toBe(HTTP_STATUS.OK);

      const checkRes = await request(app).get(`${API_ROUTES.USERS}/${user._id}`);
      expect(checkRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it("should remove deleted user from all skills' users arrays", async () => {
      const user = await createUser();
      const skills = await createSkills(2);
      const Skill = require("../../models/mongo/Skill");
      for (const skill of skills) {
        skill.users.push(user._id);
        await skill.save();
      }
      await request(app).delete(`${API_ROUTES.USERS}/${user._id}`);
      // Check skills no longer have the user
      const updatedSkills = await Skill.find({ _id: { $in: skills.map(s => s._id) } });
      for (const skill of updatedSkills) {
        expect(skill.users.map(String)).not.toContain(user._id.toString());
      }
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`${API_ROUTES.USERS}/${fakeId}`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("POST /api/users/:id/skills", () => {
    it("should add skills to user", async () => {
      // Create skills for this test
      const skills = await createSkills(2);

      const user = await createUser();

      const response = await request(app)
        .post(`${API_ROUTES.USERS}/${user._id}/skills`)
        .send({
          skills: [skills[0]._id.toString(), skills[1]._id.toString()],
        });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.user.skills).toBeDefined();
    });
  });

  describe("DELETE /api/users/:id/skills/:skill", () => {
    it("should remove a skill from user", async () => {
      // Create skills for this test
      const skills = await createSkills(1);

      const user = await createUser();

      // Add skill to user
      await request(app)
        .post(`${API_ROUTES.USERS}/${user._id}/skills`)
        .send({
          skills: [skills[0]._id.toString()],
        });

      // Now remove it
      const response = await request(app).delete(`${API_ROUTES.USERS}/${user._id}/skills/${skills[0]._id}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
    });
  });

  describe("POST /api/users/follow/:targetId", () => {
    it("should follow a user", async () => {
      const user1 = await createUser({ email: "user1@test.com" });
      const user2 = await createUser({ email: "user2@test.com" });

      userId = user1._id;
      userId2 = user2._id;

      const response = await request(app)
        .post(`${API_ROUTES.USERS}/follow/${userId2}`)
        .send({ userId });

      expect(response.status).toBe(HTTP_STATUS.OK);
    });

    it("should not follow a non-existent user", async () => {
      const user = await createUser();

      userId = user._id;
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`${API_ROUTES.USERS}/follow/${fakeId}`)
        .send({ userId });

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("POST /api/users/unfollow/:targetId", () => {
    it("should unfollow a user", async () => {
      const user1 = await createUser({ email: "user1@test.com" });
      const user2 = await createUser({ email: "user2@test.com" });

      userId = user1._id;
      userId2 = user2._id;

      // First follow
      await request(app)
        .post(`${API_ROUTES.USERS}/follow/${userId2}`)
        .send({ userId });

      // Then unfollow
      const response = await request(app)
        .post(`${API_ROUTES.USERS}/unfollow/${userId2}`)
        .send({ userId });

      expect(response.status).toBe(HTTP_STATUS.OK);
    });
  });

  describe("GET /api/users/:userId/followers", () => {
    it("should get user followers", async () => {
      const user = await createUser();

      userId = user._id;

      const response = await request(app).get(`${API_ROUTES.USERS}/${userId}/followers`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.followers)).toBe(true);
    });
  });

  describe("GET /api/users/:userId/following", () => {
    it("should get users that user is following", async () => {
      const user = await createUser();

      userId = user._id;

      const response = await request(app).get(`${API_ROUTES.USERS}/${userId}/following`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.following)).toBe(true);
    });
  });
});
