const Review = require("../models/mongo/Review");
const projectService = require("../services/projectService");
const { getUserFlags, renderApp } = require("../utils/viewRenderer");
const profileViewModel = require("../utils/viewModels/profileViewModel");
const dashboardViewModel = require("../utils/viewModels/dashboardViewModel");

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
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, projects, reviews, [], userFlags.isReviewer);
    const dashboardProjects = dashboardViewModel.mapDashboardProjects(projects);
    const dashboardReviews = dashboardViewModel.mapDashboardReviews(reviews);

    return renderApp(res, "dashboard", {
      pageTitle: "Dashboard",
      activeNav: "dashboard",
      user: sessionUser,
      projects: dashboardProjects,
      reviews: dashboardReviews,
      numOfProjectsSeekingReview,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
    });
  } catch (error) {
    return res.redirect("/login");
  }
};
