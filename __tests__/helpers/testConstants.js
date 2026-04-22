/**
 * Test Constants
 * Centralized constants for API tests
 */

/**
 * HTTP Status Codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Default API paths for endpoints
 */
const API_ROUTES = {
  ACTIVITY_LOGS: "/api/logs",
  USERS: "/api/users",
  PROJECTS: "/api/projects",
  SKILLS: "/api/skills",
  CERTIFICATIONS: "/api/certifications",
  REVIEWS: "/api/reviews",
};

/**
 * Error codes
 */
const ERROR_CODES = {
  VALIDATION: "ERR_VALIDATION",
  NOT_FOUND: "ERR_NOT_FOUND",
  CONFLICT: "ERR_CONFLICT",
  GENERIC: "ERR_GENERIC",
  INTERNAL: "ERR_INTERNAL",
};

module.exports = {
  HTTP_STATUS,
  API_ROUTES,
  ERROR_CODES,
};
