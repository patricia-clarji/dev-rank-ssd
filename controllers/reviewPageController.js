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

exports.reviewProject = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const project = await projectService.getProject(req.params.id);

    if (isOwner(project, sessionUser._id)) {
      return res.redirect(`/projects/${req.params.id}`);
    }

    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "review-form", {
      pageTitle: `Review ${project.title}`,
      activeNav: "reviews",
      user: sessionUser,
      project: mapperService.mapProject(project),
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

    const codeQualityScore = Number(req.body.codeQualityScore || 4);
    const creativityScore = Number(req.body.creativityScore || 4);
    const cleanCodeScore = Number(req.body.cleanCodeScore || 4);

    const overallRating = (codeQualityScore + creativityScore + cleanCodeScore) / 3;

    await reviewService.createReview({
      projectId: req.params.id,
      reviewerId: sessionUser._id,
      overallRating: Number(overallRating.toFixed(2)),
      codeQualityScore,
      creativityScore,
      cleanCodeScore,
      wouldHire: req.body.wouldHire === "yes",
      generalFeedback: req.body.generalFeedback,
      suggestions: parseCsv(req.body.suggestionsCsv),
      status: "published",
    });

    return res.redirect(`/projects/${req.params.id}`);
  } catch (error) {
    console.error(error);
    return res.redirect(`/projects/${req.params.id}/review`);
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
