const reviewService = require("../services/reviewService");
const asyncHandler = require("../middleware/asyncHandler");

// Create a new review
exports.createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.body);
  res.status(201).json({ message: "Review created successfully.", review });
});

// Get all reviews
exports.getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getAllReviews(req.query);
  res.status(200).json({ reviews });
});

// Get review by ID
exports.getReview = asyncHandler(async (req, res) => {
  const review = await reviewService.getReview(req.params.reviewId);
  res.status(200).json({ review });
});

// Update review
exports.updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(req.params.reviewId, req.body);
  res.status(200).json({ message: "Review updated successfully.", review });
});

// Delete review
exports.deleteReview = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteReview(req.params.reviewId);
  res.status(200).json(result);
});
