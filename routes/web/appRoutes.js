const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/webAuth");
const dashboardController = require("../../controllers/dashboardPageController");
const profileController = require("../../controllers/profilePageController");
const projectController = require("../../controllers/projectPageController");
const reviewController = require("../../controllers/reviewPageController");
const skillController = require("../../controllers/skillPageController");
const certificationController = require("../../controllers/certificationPageController");
const exploreController = require("../../controllers/explorePageController");

const router = express.Router();

router.get("/dashboard", requireAuth, dashboardController.dashboard);
router.get("/profile", requireAuth, profileController.profile);
router.get("/profile/edit", requireAuth, profileController.editProfile);
router.post("/profile/edit", requireAuth, profileController.updateProfile);

router.get("/projects", requireAuth, projectController.projects);
router.get("/projects/new", requireAuth, projectController.newProject);
router.post("/projects", requireAuth, projectController.createProject);
router.get("/projects/:id", requireAuth, projectController.projectDetail);
router.get("/projects/:id/edit", requireAuth, projectController.editProject);
router.post("/projects/:id/edit", requireAuth, projectController.updateProject);
router.post("/projects/:id/delete", requireAuth, projectController.deleteProject);
router.get("/projects/:id/review", requireRole("reviewer", "admin"), reviewController.reviewProject);
router.post("/projects/:id/review", requireRole("reviewer", "admin"), reviewController.submitReview);

router.get("/reviews", requireAuth, reviewController.reviews);
router.get("/skills", requireAuth, skillController.skills);
router.get("/skills/:id", requireAuth, skillController.skillDetail);
router.get("/certifications", requireAuth, certificationController.certifications);
router.get("/certifications/apply", requireAuth, certificationController.applyCertification);
router.post("/certifications/apply", requireAuth, certificationController.submitCertification);
router.get("/explore", requireAuth, exploreController.explore);

module.exports = router;
