const skillService = require("../services/skillService");
const asyncHandler = require("../middleware/asyncHandler");

// Create a new skill
exports.createSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.createSkill(req.body);
  res.status(201).json({ message: "Skill created successfully.", skill });
});

// Get all skills
exports.getAllSkills = asyncHandler(async (req, res) => {
  const skills = await skillService.getAllSkills(req.query);
  res.status(200).json({ skills });
});

// Get skill by ID
exports.getSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.getSkill(req.params.skillId);
  res.status(200).json({ skill });
});

// Get skill by name
exports.getSkillByName = asyncHandler(async (req, res) => {
  const skill = await skillService.getSkillByName(req.params.name);
  res.status(200).json({ skill });
});

// Update skill
exports.updateSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.updateSkill(req.params.skillId, req.body);
  res.status(200).json({ message: "Skill updated successfully.", skill });
});

// Delete skill
exports.deleteSkill = asyncHandler(async (req, res) => {
  await skillService.deleteSkill(req.params.skillId);
  res.status(200).json({ message: "Skill deleted successfully." });
});

// Update skill by name
exports.updateSkillByName = asyncHandler(async (req, res) => {
  const skill = await skillService.updateSkillByName(req.params.name, req.body);
  res.status(200).json({ message: "Skill updated successfully.", skill });
});

// Delete skill by name
exports.deleteSkillByName = asyncHandler(async (req, res) => {
  await skillService.deleteSkillByName(req.params.name);
  res.status(200).json({ message: "Skill deleted successfully." });
});

// Get users with skill
exports.getUsersWithSkill = asyncHandler(async (req, res) => {
  const users = await skillService.getUsersWithSkill(req.params.skillId);
  res.status(200).json({ users });
})
