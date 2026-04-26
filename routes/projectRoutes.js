const express = require("express");
const { requireAuth, requireRole } = require("../middleware/webAuth");
const projectController = require("../controllers/projectPageController");
const reviewController = require("../controllers/reviewPageController");

const router = express.Router();

router.get("/projects", requireAuth, projectController.projects);
router.get("/projects/new", requireAuth, projectController.newProject);
router.post("/projects", requireAuth, projectController.createProject);
router.get("/projects/:id", requireAuth, projectController.projectDetail);
router.get("/projects/:id/edit", requireAuth, projectController.editProject);
router.post("/projects/:id/edit", requireAuth, projectController.updateProject);
router.post("/projects/:id/delete", requireAuth, projectController.deleteProject);
router.get("/projects/:id/review", requireRole("reviewer", "admin"), reviewController.reviewProject);
router.post("/projects/:id/review", requireRole("reviewer", "admin"), reviewController.submitReview);

module.exports = router;
