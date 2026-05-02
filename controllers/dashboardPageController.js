const Review = require("../models/mongo/Review");
const projectService = require("../services/projectService");
const { renderApp, getUserFlags } = require("../utils/viewRenderer");
const profileViewModel = require("../utils/viewModels/profileViewModel");
const dashboardViewModel = require("../utils/viewModels/dashboardViewModel");
const {
  fetchUserData,
  handleControllerError
} = require("../utils/controllerUtils");

exports.dashboard = async (req, res) => {
  try {
    const sessionUser = req.currentUser;

    const { projects, reviews, certifications } = await fetchUserData(sessionUser);
    const numOfProjectsSeekingReview = await projectService.getProjectsSeekingReviewCount();

    const userFlags = getUserFlags(sessionUser);
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, projects, reviews, certifications, userFlags.isReviewer);
    
    const dashboardProjects = dashboardViewModel.mapDashboardProjects(projects);
    const dashboardReviews = dashboardViewModel.mapDashboardReviews(reviews);

    return renderApp(res, "dashboard", {
      pageTitle: "Dashboard",
      activeNav: "dashboard",
      user: sessionUser,
      projects: dashboardProjects,
      reviews: dashboardReviews,
      certificationRequests: certifications,
      numOfProjectsSeekingReview,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/login", "Dashboard render failed:");
  }
};
