const express = require("express");
const { requireAuth } = require("../middleware/webAuth");
const certificationController = require("../controllers/certificationPageController");

const router = express.Router();

router.get("/certifications", requireAuth, certificationController.certifications);
router.get("/certifications/apply", requireAuth, certificationController.applyCertification);
router.post("/certifications/apply", requireAuth, certificationController.submitCertification);

module.exports = router;
