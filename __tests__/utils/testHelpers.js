/**
 * Test Utilities - Common helper functions for all tests
 */

const bcrypt = require("bcrypt");
const User = require("../../models/mongo/User");
const Project = require("../../models/mongo/Project");
const Skill = require("../../models/mongo/Skill");
const Review = require("../../models/mongo/Review");
const CertificationRequest = require("../../models/mongo/CertificationRequest");

/**
 * Create a test user
 */
const createTestUser = async (userData) => {
  const defaultUser = {
    name: "Test User",
    email: `test-${Date.now()}@test.com`,
    password: "password123",
    bio: "Test bio",
  };

  const mergedData = { ...defaultUser, ...userData };
  
  // Hash password if provided
  if (mergedData.password) {
    mergedData.passwordHash = await bcrypt.hash(mergedData.password, 10);
    delete mergedData.password;
  }

  return User.create(mergedData);
};

/**
 * Create multiple test users
 */
const createTestUsers = async (count, baseData = {}) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      name: `Test User ${i + 1}`,
      email: `test-${i}-${Date.now()}@test.com`,
      ...baseData,
    });
    users.push(user);
  }
  return users;
};

/**
 * Create a test project
 */
const createTestProject = async (userId, projectData = {}) => {
  const defaultProject = {
    title: `Test Project ${Date.now()}`,
    description: "Test project description",
    techStack: ["Node.js", "Express"],
    status: "in-progress",
    link: "https://github.com/test/project",
    user: userId,
  };

  return Project.create({ ...defaultProject, ...projectData });
};

/**
 * Create a test skill
 */
const createTestSkill = async (skillData = {}) => {
  const defaultSkill = {
    name: `Test Skill ${Date.now()}`,
    category: ["backend"],
  };

  return Skill.create({ ...defaultSkill, ...skillData });
};

/**
 * Create multiple test skills
 */
const createTestSkills = async (count, baseData = {}) => {
  const skills = [];
  for (let i = 0; i < count; i++) {
    const skill = await createTestSkill({
      name: `Test Skill ${i + 1} ${Date.now()}`,
      ...baseData,
    });
    skills.push(skill);
  }
  return skills;
};

/**
 * Create a test review
 */
const createTestReview = async (projectId, reviewerId, reviewData = {}) => {
  const defaultReview = {
    projectId,
    reviewerId,
    rating: 5,
    comment: "Great project!",
    status: "published",
  };

  return Review.create({ ...defaultReview, ...reviewData });
};

/**
 * Create a test certification request
 */
const createTestCertification = async (userId, certData = {}) => {
  const defaultCert = {
    userId,
    certificationName: `Test Cert ${Date.now()}`,
    issuer: "Test Issuer",
    issueDate: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    status: "pending",
  };

  return CertificationRequest.create({ ...defaultCert, ...certData });
};

/**
 * Assert response structure
 */
const assertStatusCode = (response, expectedStatus) => {
  expect(response.status).toBe(expectedStatus);
};

/**
 * Assert error response
 */
const assertErrorResponse = (response, expectedStatus, expectedErrorCode = null) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.error).toBeDefined();
  if (expectedErrorCode) {
    expect(response.body.errorCode).toBe(expectedErrorCode);
  }
};

/**
 * Assert successful creation response
 */
const assertCreatedResponse = (response, resourceName) => {
  expect(response.status).toBe(201);
  expect(response.body[resourceName]).toBeDefined();
  expect(response.body[resourceName]._id).toBeDefined();
  return response.body[resourceName];
};

/**
 * Assert successful list response
 */
const assertListResponse = (response, resourceName) => {
  expect(response.status).toBe(200);
  expect(Array.isArray(response.body[resourceName])).toBe(true);
  return response.body[resourceName];
};

/**
 * Assert successful single resource response
 */
const assertSingleResourceResponse = (response, resourceName) => {
  expect(response.status).toBe(200);
  expect(response.body[resourceName]).toBeDefined();
  expect(response.body[resourceName]._id).toBeDefined();
  return response.body[resourceName];
};

/**
 * Clear all collections
 */
const clearAllCollections = async () => {
  const models = [User, Project, Skill, Review, CertificationRequest];

  for (const model of models) {
    try {
      await model.deleteMany({});
    } catch (error) {
      console.warn(`Could not clear ${model.modelName}:`, error.message);
    }
  }
};

module.exports = {
  // User utilities
  createTestUser,
  createTestUsers,

  // Project utilities
  createTestProject,

  // Skill utilities
  createTestSkill,
  createTestSkills,

  // Review utilities
  createTestReview,

  // Certification utilities
  createTestCertification,

  // Assertion utilities
  assertStatusCode,
  assertErrorResponse,
  assertCreatedResponse,
  assertListResponse,
  assertSingleResourceResponse,

  // Database utilities
  clearAllCollections,
};
