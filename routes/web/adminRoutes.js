const express = require("express");
const { requireRole } = require("../../middleware/webAuth");
const adminController = require("../../controllers/adminPageController");

const router = express.Router();

router.get("/admin", requireRole("admin"), adminController.adminDashboard);
router.get("/admin/certifications", requireRole("admin"), adminController.adminCertifications);
router.post("/admin/certifications/:id/approve", requireRole("admin"), adminController.approveCertification);
router.post("/admin/certifications/:id/reject", requireRole("admin"), adminController.rejectCertification);
router.get("/admin/logs", requireRole("admin"), adminController.adminLogs);

module.exports = router;
