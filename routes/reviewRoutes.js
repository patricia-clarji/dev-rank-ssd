const express = require("express");
const { requireAuth } = require("../middleware/webAuth");
const reviewController = require("../controllers/reviewPageController");

const router = express.Router();

router.get("/reviews", requireAuth, reviewController.reviews);
router.get("/reviews/:reviewId/edit", requireAuth, reviewController.editReview);
router.post("/reviews/:reviewId/edit", requireAuth, reviewController.updateReview);
router.post("/reviews/:reviewId/delete", requireAuth, reviewController.deleteReview);

module.exports = router;
