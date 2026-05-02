const projectService = require("../services/projectService");
const userService = require("../services/userService");
const Review = require("../models/mongo/Review");
const { getUserFlags, renderApp } = require("../utils/viewRenderer");
const profileViewModel = require("../utils/viewModels/profileViewModel");
const certificationService = require("../services/certificationService");
const exploreViewModel = require("../utils/viewModels/exploreViewModel");
const { REVIEW_STATUSES, PROJECT_STATUSES } = require("../constants/statusConstants");

function matchesQuery(values, query) {
  if (!query) return true;

  const haystack = values
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

exports.explore = async (req, res) => {
  try {
    const sessionUser = req.currentUser;

    const queryRaw = String(req.query.q || "").trim();
    const query = queryRaw.toLowerCase();
    const status = String(req.query.status || "all").trim();
    const role = String(req.query.role || "all").trim();
    const includeDevelopers =
      req.query.developers === "1" || req.query.developers === "on";

    const activeTab = includeDevelopers ? "developers" : "projects";

    const projects = await projectService.getAllProjects({
      status: status !== "all" ? status : undefined,
    });

    const visibleProjects = projects.filter(
      (project) => project.status !== PROJECT_STATUSES.DRAFT
    );

    const exploreUsers = await userService.getAllUsers();

    const filteredExploreUsers = exploreUsers.filter((user) => {
      if (!sessionUser) return true;
      return String(user._id) !== String(sessionUser._id);
    });

    const filteredProjects = visibleProjects.filter((project) => {
      const owner = project.user || {};

      return matchesQuery(
        [project.title, project.description, ...(project.techStack || []), owner.name, owner.username],
        query
      );
    });

    const matchingUsers = filteredExploreUsers.filter((user) => {
      let roleMatch = true;

      if (role === "developer") {
        roleMatch = user.role === "developer";
      } else if (role === "reviewer") {
        roleMatch = user.role === "reviewer";
      } else if (role === "admin") {
        roleMatch = user.role === "admin";
      } else if (role === "both") {
        roleMatch = user.role === "developer" || user.role === "reviewer";
      }

      const queryMatch = matchesQuery(
        [
          user.name,
          user.username,
          user.bio,
          ...(user.skills || []).map((skill) => (typeof skill === "string" ? skill : skill.name)),
        ],
        query
      );

      return roleMatch && queryMatch;
    });

    const filteredUsers = includeDevelopers ? matchingUsers : [];

    const userFlags = getUserFlags(sessionUser);
    const userProjects = sessionUser ? await projectService.getProjectsByUser(sessionUser._id) : [];
    const userProjectIds = userProjects.map((p) => p._id);
    const userReviews = userProjectIds.length > 0
      ? await Review.find({ project: { $in: userProjectIds }, status: REVIEW_STATUSES.PUBLISHED })
          .populate("project", "title")
          .populate("reviewer", "name")
      : [];
    const certifications = await certificationService.getAllRequests();
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, userProjects, userReviews, certifications, userFlags.isReviewer);
    const exploreProjects = exploreViewModel.mapExploreProjects(filteredProjects);
    const exploreDevelopers = exploreViewModel.mapExploreDevelopers(filteredUsers);
    const exploreFilters = exploreViewModel.mapExploreFilters(includeDevelopers, status, role);

    return renderApp(res, "explore", {
      pageTitle: "Explore",
      activeNav: "explore",
      user: sessionUser,
      projects: exploreProjects,
      exploreUsers: exploreDevelopers,
      exploreUsersTotal: matchingUsers.length,
      exploreProjectsTotal: filteredProjects.length,
      exploreSearchQuery: queryRaw,
      exploreStatusFilter: status,
      exploreRoleFilter: role,
      exploreIncludeDevelopers: includeDevelopers,
      exploreActiveTab: activeTab,
      exploreFilters,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
      certificationRequests: certifications,
      reviews: userReviews,
    });
  } catch (error) {
    return res.redirect("/dashboard");
  }
};