/**
 * Skill Endpoint Tests
 * Tests for /api/skills endpoints
 */

const request = require("supertest");
const mongoose = require("mongoose");
const Skill = require("../../models/mongo/Skill");
const skillRoutes = require("../../routes/skillRoutes");
const { createTestApp } = require("../helpers/testSetup");
const { clearMongoCollection } = require("../helpers/db");
const { HTTP_STATUS, API_ROUTES } = require("../helpers/testConstants");
const { createSkill, createSkills } = require("../factories/skillFactory");

const app = createTestApp(API_ROUTES.SKILLS, skillRoutes);

describe("Skill API Endpoints", () => {
  let skillId;

  beforeEach(async () => {
    await clearMongoCollection(Skill);
  });

  describe("POST /api/skills", () => {
    it("should create a new skill", async () => {
      const skillData = {
        name: "TypeScript",
        category: ["backend", "frontend"],
      };

      const response = await request(app)
        .post(API_ROUTES.SKILLS)
        .send(skillData);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(response.body.skill).toBeDefined();
      expect(response.body.skill.name).toBe(skillData.name);
      skillId = response.body.skill._id;
    });

    it("should fail when missing required fields", async () => {
      const response = await request(app)
        .post(API_ROUTES.SKILLS)
        .send({ name: "JavaScript" });

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it("should fail when skill name already exists", async () => {
      const skillData = {
        name: "Duplicate Skill",
        category: ["backend"],
      };

      await request(app)
        .post(API_ROUTES.SKILLS)
        .send(skillData);

      const response = await request(app)
        .post(API_ROUTES.SKILLS)
        .send(skillData);

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    });
  });

  describe("GET /api/skills", () => {
    it("should get all skills", async () => {
      await createSkills(2);

      const response = await request(app).get(API_ROUTES.SKILLS);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.skills)).toBe(true);
      expect(response.body.skills.length).toBe(2);
    });

    it("should return empty array when no skills exist", async () => {
      const response = await request(app).get(API_ROUTES.SKILLS);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.skills).toEqual([]);
    });

    it("should filter skills by category", async () => {
      await createSkills(2);

      const response = await request(app)
        .get(API_ROUTES.SKILLS)
        .query({ category: "frontend" });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.skills)).toBe(true);
    });
  });

  describe("GET /api/skills/name/:name", () => {
    it("should get skill by name", async () => {
      const skill = await createSkill({
        name: "Unique Skill",
      });

      const response = await request(app).get(`${API_ROUTES.SKILLS}/name/${skill.name}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.skill.name).toBe(skill.name);
    });

    it("should return 404 for non-existent skill", async () => {
      const response = await request(app).get(`${API_ROUTES.SKILLS}/name/NonExistent`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("GET /api/skills/:id", () => {
    it("should get skill by ID", async () => {
      const skill = await createSkill();

      const response = await request(app).get(`${API_ROUTES.SKILLS}/${skill._id}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.skill._id).toBe(skill._id.toString());
    });

    it("should return 404 for invalid skill ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`${API_ROUTES.SKILLS}/${fakeId}`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("PUT /api/skills/name/:name", () => {
    it("should update skill by name", async () => {
      const skill = await createSkill({
        name: "Update By Name",
        category: ["frontend"],
      });

      const response = await request(app)
        .put(`${API_ROUTES.SKILLS}/name/${skill.name}`)
        .send({ category: ["frontend", "database"] });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.skill.category).toContain("database");
    });

    it("should return 404 for non-existent skill", async () => {
      const response = await request(app)
        .put(`${API_ROUTES.SKILLS}/name/NonExistent`)
        .send({ category: ["frontend"] });

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("PUT /api/skills/:id", () => {
    it("should update skill by ID", async () => {
      const skill = await createSkill({
        category: ["frontend"],
      });

      const response = await request(app)
        .put(`${API_ROUTES.SKILLS}/${skill._id}`)
        .send({ category: ["frontend", "database"] });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.skill.category).toContain("database");
    });

    it("should return 404 for non-existent skill", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`${API_ROUTES.SKILLS}/${fakeId}`)
        .send({ category: ["frontend"] });

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("DELETE /api/skills/name/:name", () => {
    it("should delete skill by name", async () => {
      const skill = await createSkill({
        name: "Delete By Name",
      });

      const response = await request(app).delete(`${API_ROUTES.SKILLS}/name/${skill.name}`);

      expect(response.status).toBe(HTTP_STATUS.OK);

      const checkRes = await request(app).get(`${API_ROUTES.SKILLS}/name/${skill.name}`);
      expect(checkRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it("should return 404 for non-existent skill", async () => {
      const response = await request(app).delete(`${API_ROUTES.SKILLS}/name/NonExistent`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("DELETE /api/skills/:id", () => {
    it("should delete skill by ID", async () => {
      const skill = await createSkill();

      const response = await request(app).delete(`${API_ROUTES.SKILLS}/${skill._id}`);

      expect(response.status).toBe(HTTP_STATUS.OK);

      const checkRes = await request(app).get(`${API_ROUTES.SKILLS}/${skill._id}`);
      expect(checkRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it("should remove deleted skill from all users' skills arrays", async () => {
      // Create skill and users
      const skill = await createSkill();
      const userFactory = require("../factories/userFactory");
      const users = await userFactory.createUsers(2);
      // Add skill to both users
      const User = require("../../models/mongo/User");
      for (const user of users) {
        user.skills.push(skill._id);
        await user.save();
      }
      // Delete skill
      await request(app).delete(`${API_ROUTES.SKILLS}/${skill._id}`);
      // Check users no longer have the skill
      const updatedUsers = await User.find({ _id: { $in: users.map(u => u._id) } });
      for (const user of updatedUsers) {
        expect(user.skills.map(String)).not.toContain(skill._id.toString());
      }
    });

    it("should return 404 for non-existent skill", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`${API_ROUTES.SKILLS}/${fakeId}`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });
});
