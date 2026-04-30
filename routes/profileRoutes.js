const express = require("express");
const { requireAuth } = require("../middleware/webAuth");
const profileController = require("../controllers/profilePageController");

const router = express.Router();

router.get("/profile", requireAuth, profileController.profile);
router.get("/profile/edit", requireAuth, profileController.editProfile);
router.get("/profile/complete", requireAuth, profileController.completeProfile);
router.post("/profile/edit", requireAuth, profileController.updateProfile);
router.post("/profile/complete", requireAuth, profileController.updateProfile);

module.exports = router;
