const express = require("express");
const { requireAuth } = require("../middleware/webAuth");
const dashboardController = require("../controllers/dashboardPageController");
const exploreController = require("../controllers/explorePageController");

const router = express.Router();

router.get("/dashboard", requireAuth, dashboardController.dashboard);
router.get("/explore", requireAuth, exploreController.explore);

module.exports = router;
