/**
 * Skill Factory
 * Creates test Skill instances with sensible defaults
 */

const Skill = require("../../models/mongo/Skill");

/**
 * Default skill data
 */
const DEFAULT_SKILL = {
  name: "JavaScript",
  category: ["backend", "frontend"],
};

/**
 * Creates a single test skill
 * @param {Object} overrides - Property overrides for the default skill
 * @returns {Promise<Object>} Created skill
 */
async function createSkill(overrides = {}) {
  const data = { ...DEFAULT_SKILL, ...overrides };
  return Skill.create(data);
}

/**
 * Creates multiple test skills
 * @param {number} count - Number of skills to create
 * @param {Function} overrideFn - Function to generate unique overrides per skill
 * @returns {Promise<Array>} Array of created skills
 */
async function createSkills(count = 1, overrideFn) {
  const skills = [];
  const defaultSkills = [
    {
      name: "JavaScript",
      category: ["backend", "frontend"],
    },
    {
      name: "React",
      category: ["frontend"],
    },
    {
      name: "MongoDB",
      category: ["database"],
    },
    {
      name: "Node.js",
      category: ["backend"],
    },
    {
      name: "Python",
      category: ["backend"],
    },
  ];

  for (let i = 0; i < count; i++) {
    const base = defaultSkills[i] || DEFAULT_SKILL;
    const overrides = overrideFn ? overrideFn(i) : {};
    skills.push(await createSkill({ ...base, ...overrides }));
  }
  return skills;
}

module.exports = {
  createSkill,
  createSkills,
  DEFAULT_SKILL,
};
