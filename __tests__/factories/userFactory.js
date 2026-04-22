/**
 * User Factory
 * Creates test User instances with sensible defaults
 */

const User = require("../../models/mongo/User");

/**
 * Default user data
 */
const DEFAULT_USER = {
  name: "Test User",
  email: "test@test.com",
  passwordHash: "hashed",
  bio: "Test user",
};

/**
 * Creates a single test user
 * @param {Object} overrides - Property overrides for the default user
 * @returns {Promise<Object>} Created user
 */
async function createUser(overrides = {}) {
  const data = { ...DEFAULT_USER, ...overrides };
  return User.create(data);
}

/**
 * Creates multiple test users
 * @param {number} count - Number of users to create
 * @param {Function} overrideFn - Function to generate unique overrides per user
 * @returns {Promise<Array>} Array of created users
 */
async function createUsers(count = 1, overrideFn) {
  const users = [];
  const defaultUsers = [
    {
      name: "John Doe",
      email: "john@test.com",
      passwordHash: "hashed",
      bio: "Test user",
    },
    {
      name: "Jane Smith",
      email: "jane@test.com",
      passwordHash: "hashed",
      bio: "Another test user",
    },
    {
      name: "Bob Johnson",
      email: "bob@test.com",
      passwordHash: "hashed",
      bio: "Third test user",
    },
  ];

  for (let i = 0; i < count; i++) {
    const base = defaultUsers[i] || DEFAULT_USER;
    const overrides = overrideFn ? overrideFn(i) : {};
    users.push(await createUser({ ...base, ...overrides }));
  }
  return users;
}

/**
 * Creates a test reviewer user
 * @param {Object} overrides - Property overrides
 * @returns {Promise<Object>} Created reviewer user
 */
async function createReviewerUser(overrides = {}) {
  return createUser({
    name: "Test Reviewer",
    email: "reviewer@test.com",
    role: "reviewer",
    isVerifiedReviewer: true,
    ...overrides,
  });
}

module.exports = {
  createUser,
  createUsers,
  createReviewerUser,
  DEFAULT_USER,
};
