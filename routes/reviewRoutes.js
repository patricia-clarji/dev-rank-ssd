const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const {validateUpdateReview, validateCreateReview, validateGetAllReviewsQuery} = require("../middleware/validators/reviewValidators");

// POST /api/reviews - Create a new review
router.post("/", validateCreateReview, reviewController.createReview);

// GET /api/reviews - Get all reviews (optional filters: by projectId or by reviewerId or by status)
router.get("/", validateGetAllReviewsQuery, reviewController.getAllReviews);

// GET /api/reviews/:reviewId - Get review by ID
router.get("/:reviewId", reviewController.getReview);

// PUT /api/reviews/:reviewId - Update review
router.put("/:reviewId", validateUpdateReview, reviewController.updateReview);

// DELETE /api/reviews/:reviewId - Delete review
router.delete("/:reviewId", reviewController.deleteReview);

module.exports = router;
