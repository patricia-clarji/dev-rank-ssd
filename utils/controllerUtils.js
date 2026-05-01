const Review = require("../models/mongo/Review");
const projectService = require("../services/projectService");
const certificationService = require("../services/certificationService");
const { getUserFlags } = require("./viewRenderer");
const profileViewModel = require("./viewModels/profileViewModel");
const { REVIEW_STATUSES } = require("../constants/statusConstants");

/**
 * Common controller utilities for fetching user data and building view models
 */

/**
 * Fetches all user-related data needed for profile/dashboard views
 * @param {Object} user - The current user
 * @param {boolean} includeCertifications - Whether to include certification requests
 * @returns {Object} User data object
 */
async function fetchUserData(user, includeCertifications = true) {
  const projects = await projectService.getProjectsByUser(user._id);
  const projectIds = projects.map((project) => project._id);

  let reviews = [];
  if (projectIds.length > 0) {
    reviews = await Review.find({
      project: { $in: projectIds },
      status: REVIEW_STATUSES.PUBLISHED
    })
      .populate("project", "title status")
      .populate("reviewer", "name email role githubUrl username")
      .sort({ createdAt: -1 });
  }

  const certifications = includeCertifications
    ? await certificationService.getAllRequests()
    : [];

  return { projects, reviews, certifications };
}

/**
 * Builds common view model data for profile/dashboard pages
 * @param {Object} user - The current user
 * @param {Array} projects - User's projects
 * @param {Array} reviews - User's reviews
 * @param {Array} certifications - Certification requests
 * @returns {Object} View model data
 */
function buildCommonViewModel(user, projects, reviews, certifications) {
  const userFlags = getUserFlags(user);
  const profileVM = profileViewModel.mapUserProfileView(
    user,
    projects,
    reviews,
    certifications,
    userFlags.isReviewer
  );

  return {
    user,
    projects,
    reviews,
    certifications,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
    isSuperAdmin: userFlags.isSuperAdmin,
    ...profileVM,
  };
}

/**
 * Standard error handler for controller methods
 * @param {Error} error - The error that occurred
 * @param {Object} res - Express response object
 * @param {string} redirectPath - Path to redirect to on error
 * @param {string} errorMessage - Optional error message for logging
 */
function handleControllerError(error, res, redirectPath, errorMessage = null) {
  if (errorMessage) {
    console.error(errorMessage, error);
  } else {
    console.error("Controller error:", error);
  }
  return res.redirect(redirectPath);
}

/**
 * Checks if a user owns a project
 * @param {Object} project - The project object
 * @param {string} userId - The user ID to check
 * @returns {boolean} True if user owns the project
 */
function isProjectOwner(project, userId) {
  if (!project || !project.user || !userId) return false;
  return String(project.user._id || project.user) === String(userId);
}

/**
 * Checks if a user can edit a review
 * @param {Object} review - The review object
 * @param {Object} user - The user object
 * @returns {boolean} True if user can edit the review
 */
function canEditReview(review, user) {
  if (!review || !user) return false;
  if (user.role === "admin") return true;

  const reviewOwnerId = review.reviewer && review.reviewer._id
    ? String(review.reviewer._id)
    : String(review.reviewer || "");
  return reviewOwnerId && String(user._id) === reviewOwnerId;
}

/**
 * Checks if a user can delete a review
 * @param {Object} review - The review object
 * @param {Object} user - The user object
 * @returns {boolean} True if user can delete the review
 */
function canDeleteReview(review, user) {
  return canEditReview(review, user);
}

module.exports = {
  fetchUserData,
  buildCommonViewModel,
  handleControllerError,
  isProjectOwner,
  canEditReview,
  canDeleteReview,
};