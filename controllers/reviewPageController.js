const projectService = require("../services/projectService");
const reviewService = require("../services/reviewService");
const { getUserFlags, renderApp } = require("../utils/viewRenderer");
const mapperService = require("../services/mapperService");

function parseCsv(csvValue) {
  return String(csvValue || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isOwner(project, userId) {
  if (!project || !project.user || !userId) return false;
  return String(project.user._id || project.user) === String(userId);
}

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
    generalFeedback: body.generalFeedback,
    suggestions: parseCsv(body.suggestionsCsv),
    status: "published",
  };
}

function canEditReview(review, user) {
  if (!review || !user) return false;
  if (user.role === "admin") return true;

  const reviewOwnerId = review.reviewer && review.reviewer._id ? String(review.reviewer._id) : String(review.reviewer || "");
  return reviewOwnerId && String(user._id) === reviewOwnerId;
}

function canDeleteReview(review, user) {
  return canEditReview(review, user);
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

    if (isOwner(project, sessionUser._id)) {
      return res.redirect(`/projects/${req.params.id}`);
    }

    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "review-form", {
      pageTitle: `Review ${project.title}`,
      activeNav: "reviews",
      user: sessionUser,
      formMode: "create",
      project: mapperService.mapProject(project),
      review: null,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/projects");
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
    console.error(error);
    return res.redirect(`/projects/${req.params.id}/review`);
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

    return renderApp(res, "review-form", {
      pageTitle: `Edit Review for ${project.title}`,
      activeNav: "reviews",
      user: sessionUser,
      formMode: "edit",
      project: mapperService.mapProject(project),
      review: mapperService.mapReview(review),
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
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

    
    
    return renderApp(res, "reviews", {
      pageTitle: "Reviews",
      activeNav: "reviews",
      user: sessionUser,
      receivedReviews: receivedReviews.map(mapperService.mapReview).filter(Boolean),
      givenReviews: givenReviews.map(mapperService.mapReview).filter(Boolean),
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/dashboard");
  }
};
