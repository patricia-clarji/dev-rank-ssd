/**
 * Project Factory
 * Creates test Project instances with sensible defaults
 */

const Project = require("../../models/mongo/Project");

/**
 * Default project data
 */
const DEFAULT_PROJECT = {
  title: "Test Project",
  description: "A comprehensive test project description",
  techStack: ["Node.js", "Express"],
  status: "seeking-review",
  repoUrl: "https://github.com/test/project",
  liveUrl: "https://test-project.demo.com",
};

/**
 * Creates a single test project
 * @param {string|Object} userIdOrData - User ID or full project data with user field
 * @param {Object} overrides - Property overrides for the default project
 * @returns {Promise<Object>} Created project
 */
async function createProject(userIdOrData, overrides = {}) {
  let data;
  
  if (typeof userIdOrData === "string") {
    // First argument is userId
    data = { ...DEFAULT_PROJECT, user: userIdOrData, ...overrides };
  } else {
    // First argument is the full data object
    data = { ...DEFAULT_PROJECT, ...userIdOrData, ...overrides };
  }
  
  return Project.create(data);
}

/**
 * Creates multiple test projects
 * @param {string} userId - User ID for all projects
 * @param {number} count - Number of projects to create
 * @param {Function} overrideFn - Function to generate unique overrides per project
 * @returns {Promise<Array>} Array of created projects
 */
async function createProjects(userId, count = 1, overrideFn) {
  const projects = [];
  const defaultProjects = [
    {
      title: "Test Project 1",
      description: "A comprehensive test project description",
      techStack: ["Node.js", "Express"],
      status: "seeking-review",
      repoUrl: "https://github.com/test/project1",
      liveUrl: "https://test-project1.demo.com",
    },
    {
      title: "Test Project 2",
      description: "Another comprehensive test project description",
      techStack: ["React", "MongoDB"],
      status: "under-review",
      repoUrl: "https://github.com/test/project2",
      liveUrl: "https://test-project2.demo.com",
    },
    {
      title: "Test Project 3",
      description: "Third comprehensive test project description",
      techStack: ["Vue.js", "PostgreSQL"],
      status: "approved",
      repoUrl: "https://github.com/test/project3",
      liveUrl: "https://test-project3.demo.com",
    },
  ];

  for (let i = 0; i < count; i++) {
    const base = defaultProjects[i] || DEFAULT_PROJECT;
    const overrides = overrideFn ? overrideFn(i) : {};
    projects.push(await createProject(userId, { ...base, ...overrides }));
  }
  return projects;
}

module.exports = {
  createProject,
  createProjects,
  DEFAULT_PROJECT,
};
