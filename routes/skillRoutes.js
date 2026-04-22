const express = require("express");
const router = express.Router();
const skillController = require("../controllers/skillController");
const {validateCreateSkill, validateUpdateSkill, validateGetAllSkillsQuery} = require("../middleware/validators/skillValidators");

// POST /api/skills - Create a new skill
router.post("/", validateCreateSkill, skillController.createSkill);

// GET /api/skills - Get all skills
router.get("/", validateGetAllSkillsQuery, skillController.getAllSkills);

// GET /api/skills/name/:name - Get skill by name
router.get("/name/:name", skillController.getSkillByName);

// PUT /api/skills/name/:name - Update skill by name
router.put("/name/:name", validateUpdateSkill, skillController.updateSkillByName);

// DELETE /api/skills/name/:name - Delete skill by name
router.delete("/name/:name", skillController.deleteSkillByName);

// GET /api/skills/:skillId - Get skill by ID
router.get("/:skillId", skillController.getSkill);

// PUT /api/skills/:skillId - Update skill
router.put("/:skillId", validateUpdateSkill, skillController.updateSkill);

// DELETE /api/skills/:skillId - Delete skill
router.delete("/:skillId", skillController.deleteSkill);

// GET api/skillId/users - Get users with skill
router.get("/:skillId/users", skillController.getUsersWithSkill)

module.exports = router;
