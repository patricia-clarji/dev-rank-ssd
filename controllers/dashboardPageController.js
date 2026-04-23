const Review = require("../models/mongo/Review");
const projectService = require("../services/projectService");
const { getUserFlags, renderApp } = require("./viewModel");

exports.dashboard = async (req, res) => {
  try {
    const sessionUser = req.currentUser;

    const projects = await projectService.getProjectsByUser(sessionUser._id);
    const projectIds = projects.map((project) => project._id);
    const numOfProjectsSeekingReview = await projectService.getProjectsSeekingReviewCount();
    let reviews = [];
    if (projectIds.length > 0) {
      reviews = await Review.find({ project: { $in: projectIds }, status: "published" })
        .populate("project", "title status")
        .populate("reviewer", "name email role githubUrl username")
        .sort({ createdAt: -1 });
    }

    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "dashboard", {
      pageTitle: "Dashboard",
      activeNav: "dashboard",
      user: sessionUser,
      projects,
      reviews,
      numOfProjectsSeekingReview,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/login");
  }
};
