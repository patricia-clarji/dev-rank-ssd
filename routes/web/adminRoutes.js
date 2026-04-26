const express = require("express");
const { requireRole } = require("../../middleware/webAuth");
const adminController = require("../../controllers/adminPageController");

const router = express.Router();

router.get("/admin", requireRole("admin"), adminController.adminDashboard);
router.get("/admin/certifications", requireRole("admin"), adminController.adminCertifications);
router.post("/admin/certifications/:id/approve", requireRole("admin"), adminController.approveCertification);
router.post("/admin/certifications/:id/reject", requireRole("admin"), adminController.rejectCertification);
router.get("/admin/logs", requireRole("admin"), adminController.adminLogs);

// Skills management routes
router.get("/admin/skills", requireRole("admin"), adminController.adminSkills);
router.get("/admin/skills/new", requireRole("admin"), adminController.newSkillForm);
router.post("/admin/skills", requireRole("admin"), adminController.createSkill);
router.get("/admin/skills/:id/edit", requireRole("admin"), adminController.editSkillForm);
router.post("/admin/skills/:id/edit", requireRole("admin"), adminController.updateSkill);
router.post("/admin/skills/:id/delete", requireRole("admin"), adminController.deleteSkill);

module.exports = router;
