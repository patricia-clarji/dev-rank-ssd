const express = require("express");
const { requireAuth } = require("../middleware/webAuth");
const skillController = require("../controllers/skillPageController");

const router = express.Router();

router.get("/skills", requireAuth, skillController.skills);
router.get("/skills/:id", requireAuth, skillController.skillDetail);

module.exports = router;
