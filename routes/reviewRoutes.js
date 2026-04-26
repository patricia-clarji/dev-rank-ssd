const express = require("express");
const { requireAuth } = require("../middleware/webAuth");
const reviewController = require("../controllers/reviewPageController");

const router = express.Router();

router.get("/reviews", requireAuth, reviewController.reviews);

module.exports = router;
