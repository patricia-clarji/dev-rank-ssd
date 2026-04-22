/**
 * Review Factory
 * Creates test Review instances with sensible defaults
 */

const Review = require("../../models/mongo/Review");

/**
 * Default review data
 */
const DEFAULT_REVIEW = {
  overallRating: 5,
  codeQualityScore: 5,
  creativityScore: 4,
  cleanCodeScore: 5,
  wouldHire: true,
  generalFeedback: "Excellent project with great code quality!",
  suggestions: ["Consider adding more error handling"],
  status: "published",
};

/**
 * Creates a single test review
 * @param {string|Object} reviewerIdOrData - Reviewer ID or full review data with reviewerId
 * @param {string|Object} projectIdOrOverrides - Project ID or overrides
 * @param {Object} overrides - Property overrides for the default review
 * @returns {Promise<Object>} Created review
 */
async function createReview(reviewerIdOrData, projectIdOrOverrides, overrides = {}) {
  let data;
  
  if (typeof reviewerIdOrData === "string" && typeof projectIdOrOverrides === "string") {
    // First two args are IDs
    data = {
      ...DEFAULT_REVIEW,
      reviewer: reviewerIdOrData,
      project: projectIdOrOverrides,
      ...overrides,
    };
  } else if (typeof reviewerIdOrData === "object") {
    // First argument is the full data object
    data = { ...DEFAULT_REVIEW, ...reviewerIdOrData, ...projectIdOrOverrides };
  }
  
  return Review.create(data);
}

/**
 * Creates multiple test reviews
 * @param {string} reviewerId - Reviewer ID for all reviews
 * @param {string} projectId - Project ID for all reviews
 * @param {number} count - Number of reviews to create
 * @param {Function} overrideFn - Function to generate unique overrides per review
 * @returns {Promise<Array>} Array of created reviews
 */
async function createReviews(reviewerId, projectId, count = 1, overrideFn) {
  const reviews = [];
  const defaultReviews = [
    {
      overallRating: 5,
      codeQualityScore: 5,
      creativityScore: 4,
      cleanCodeScore: 5,
      wouldHire: true,
      generalFeedback: "Excellent project with great code quality!",
      suggestions: ["Consider adding more error handling"],
      status: "published",
    },
    {
      overallRating: 4,
      codeQualityScore: 4,
      creativityScore: 4,
      cleanCodeScore: 4,
      wouldHire: true,
      generalFeedback: "Good work overall with solid implementation",
      suggestions: ["Add more unit tests"],
      status: "published",
    },
    {
      overallRating: 3,
      codeQualityScore: 3,
      creativityScore: 3,
      cleanCodeScore: 3,
      wouldHire: false,
      generalFeedback: "Average performance, needs improvement",
      suggestions: ["Refactor for readability", "Improve documentation"],
      status: "published",
    },
  ];

  for (let i = 0; i < count; i++) {
    const base = defaultReviews[i] || DEFAULT_REVIEW;
    const overrides = overrideFn ? overrideFn(i) : {};
    reviews.push(
      await createReview(reviewerId, projectId, { ...base, ...overrides })
    );
  }
  return reviews;
}

module.exports = {
  createReview,
  createReviews,
  DEFAULT_REVIEW,
};
