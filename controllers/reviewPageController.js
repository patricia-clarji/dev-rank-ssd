const projectService = require("../services/projectService");
const reviewService = require("../services/reviewService");
const { getUserFlags, renderApp, mapProject } = require("./viewModel");

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
      project: mapProject(project),
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
      overallRating: Number(req.body.overallRating || 5),
      codeQualityScore: Number(req.body.codeQualityScore || 4),
      creativityScore: Number(req.body.creativityScore || 4),
      cleanCodeScore: Number(req.body.cleanCodeScore || 4),
      wouldHire: req.body.wouldHire === "yes",
      generalFeedback: req.body.generalFeedback,
      suggestions: parseCsv(req.body.suggestionsCsv),
      status: "published",
    });

    return res.redirect(`/projects/${req.params.id}`);
  } catch (error) {
    return res.redirect(`/projects/${req.params.id}/review`);
  }
};

exports.reviews = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const reviews = await reviewService.getAllReviews({ reviewerId: sessionUser._id });
    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "reviews", {
      pageTitle: "Reviews",
      activeNav: "reviews",
      user: sessionUser,
      reviews,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/dashboard");
  }
};
