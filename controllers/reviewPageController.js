const projectService = require("../services/projectService");
const reviewService = require("../services/reviewService");
const Review = require("../models/mongo/Review");
const { getUserFlags, renderApp } = require("../utils/viewRenderer");
const mapperService = require("../services/mapperService");
const profileViewModel = require("../utils/viewModels/profileViewModel");
const certificationService = require("../services/certificationService");
const reviewsListViewModel = require("../utils/viewModels/reviewsListViewModel");
const { parseCsv, sanitizeText } = require("../utils/stringUtils");
const {
  fetchUserData,
  handleControllerError,
  isProjectOwner,
  canEditReview,
  canDeleteReview
} = require("../utils/controllerUtils");
const { REVIEW_STATUSES } = require("../constants/statusConstants");

function getReviewPayload(body) {
  const codeQualityScore = Number(body.codeQualityScore || 4);
  const creativityScore = Number(body.creativityScore || 4);
  const cleanCodeScore = Number(body.cleanCodeScore || 4);
  const overallRating = (codeQualityScore + creativityScore + cleanCodeScore) / 3;

  return {
    overallRating: Number(overallRating.toFixed(2)),
    codeQualityScore,
    creativityScore,
    cleanCodeScore,
    wouldHire: body.wouldHire === "yes",
    generalFeedback: sanitizeText(body.generalFeedback),
    suggestions: parseCsv(body.suggestionsCsv),
    status: REVIEW_STATUSES.PUBLISHED,
  };
}


exports.reviewProject = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const project = await projectService.getProject(req.params.id);
    const existingReview = (await reviewService.getAllReviews({
      projectId: req.params.id,
      reviewerId: sessionUser._id,
    }))[0];

    if (existingReview) {
      return res.redirect(`/reviews/${existingReview._id}/edit`);
    }

    if (isProjectOwner(project, sessionUser._id)) {
      return res.redirect(`/projects/${req.params.id}`);
    }

    const { projects: userProjects, reviews: userReviews, certifications } = await fetchUserData(sessionUser);
    const userFlags = getUserFlags(sessionUser);
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, userProjects, userReviews, certifications, userFlags.isReviewer);

    return renderApp(res, "review-form", {
      pageTitle: `Review ${project.title}`,
      activeNav: "reviews",
      formMode: "create",
      user: sessionUser,
      project: mapperService.mapProject(project),
      review: null,
      projects: userProjects,
      reviews: userReviews,
      certificationRequests: certifications,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/projects", "Review project form render failed:");
  }
};

exports.submitReview = async (req, res) => {
  try {
    const sessionUser = req.currentUser;

    await reviewService.createReview({
      projectId: req.params.id,
      reviewerId: sessionUser._id,
      ...getReviewPayload(req.body),
    });

    return res.redirect(`/projects/${req.params.id}`);
  } catch (error) {
    return handleControllerError(error, res, `/projects/${req.params.id}/review`, "Submit review failed:");
  }
};

exports.editReview = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const review = await reviewService.getReview(req.params.reviewId);

    if (!canEditReview(review, sessionUser)) {
      return res.redirect("/reviews");
    }

    const project = await projectService.getProject(review.project._id || review.project);
    const userFlags = getUserFlags(sessionUser);
    const userProjects = await projectService.getProjectsByUser(sessionUser._id);
    const userProjectIds = userProjects.map((p) => p._id);
    const userReviews = userProjectIds.length > 0
      ? await Review.find({ project: { $in: userProjectIds }, status: "published" })
        .populate("project", "title")
        .populate("reviewer", "name")
      : [];
    const certifications = await certificationService.getAllRequests();
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, userProjects, userReviews, certifications, userFlags.isReviewer);

    return renderApp(res, "review-form", {
      pageTitle: `Edit Review for ${project.title}`,
      activeNav: "reviews",
      user: sessionUser,
      formMode: "edit",
      project: mapperService.mapProject(project),
      review: mapperService.mapReview(review),
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      projects: userProjects,
      reviews: userReviews,
      ...profileVM,
      certificationRequests: certifications,

    });
  } catch (error) {
    return res.redirect("/reviews");
  }
};

exports.updateReview = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const review = await reviewService.getReview(req.params.reviewId);

    if (!canEditReview(review, sessionUser)) {
      return res.redirect("/reviews");
    }

    await reviewService.updateReview(req.params.reviewId, getReviewPayload(req.body));

    const projectId = review.project && review.project._id ? review.project._id : review.project;
    return res.redirect(`/projects/${projectId}`);
  } catch (error) {
    return res.redirect(`/reviews/${req.params.reviewId}/edit`);
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const review = await reviewService.getReview(req.params.reviewId);

    if (!canDeleteReview(review, sessionUser)) {
      return res.redirect("/reviews");
    }

    const redirectTo = String(req.body.returnTo || "/reviews");
    const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/reviews";

    await reviewService.deleteReview(req.params.reviewId);

    return res.redirect(safeRedirect);
  } catch (error) {
    return res.redirect("/reviews");
  }
};

exports.reviews = async (req, res) => {
  try {
    const sessionUser = req.currentUser;

    const userFlags = getUserFlags(sessionUser);
    const givenReviews = await reviewService.getAllReviews({ reviewerId: sessionUser._id });
    const receivedReviews = await reviewService.getReceivedReviews(sessionUser._id);
    const projects = await projectService.getProjectsByUser(sessionUser._id);
    const certifications = await certificationService.getAllRequests();
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, projects, receivedReviews, certifications, userFlags.isReviewer);
    const mappedReceivedReviews = receivedReviews.map(mapperService.mapReview).filter(Boolean);
    const mappedGivenReviews = givenReviews.map(mapperService.mapReview).filter(Boolean);
    const receivedReviewsList = reviewsListViewModel.mapReceivedReviews(mappedReceivedReviews);
    const givenReviewsList = reviewsListViewModel.mapGivenReviews(mappedGivenReviews);

    return renderApp(res, "reviews", {
      pageTitle: "Reviews",
      activeNav: "reviews",
      user: sessionUser,
      receivedReviews: receivedReviewsList,
      givenReviews: givenReviewsList,
      projects,
      reviews: receivedReviews,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
      certificationRequests: certifications,
    });
  } catch (error) {
    return handleControllerError(error, res, "/dashboard", "Reviews page render failed:");
  }
};
