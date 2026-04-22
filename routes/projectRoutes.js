const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const {validateCreateProject, validateUpdateProject, validateGetAllProjectsQuery} = require("../middleware/validators/projectValidators");

// POST /api/projects - Create a new project
router.post("/", validateCreateProject, projectController.createProject);

// GET /api/projects/title/:title - Get project by title
router.get("/title/:title", projectController.getProjectByTitle);

// GET /api/projects/user/:userId - Get all projects by a specific user
router.get("/user/:userId", projectController.getProjectsByUser);

// GET /api/projects/:projectId/reviews - Get reviews for a project
router.get("/:projectId/reviews", projectController.getProjectReviews);

// GET /api/projects/:projectId - Get project by ID
router.get("/:projectId", projectController.getProject);

// PUT /api/projects/:projectId - Update project
router.put("/:projectId", validateUpdateProject, projectController.updateProject);

// DELETE /api/projects/:projectId - Delete project
router.delete("/:projectId", projectController.deleteProject);

// GET /api/projects - Get all projects (optional: by status or by userId or by techstack)
router.get("/", validateGetAllProjectsQuery, projectController.getAllProjects);



module.exports = router;
