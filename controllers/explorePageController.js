const projectService = require("../services/projectService");
const userService = require("../services/userService");
const { getUserFlags, renderApp } = require("../utils/viewRenderer");

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

    const query = String(req.query.q || "").trim().toLowerCase();
    const status = String(req.query.status || "all").trim();
    const role = String(req.query.role || "all").trim();
    const includeDevelopers =
      req.query.developers === "1" || req.query.developers === "on";

    const activeTab = includeDevelopers ? "developers" : "projects";

    const projects = await projectService.getAllProjects({
      status: status !== "all" ? status : undefined,
    });

    const exploreUsers = await userService.getAllUsers();

    const filteredExploreUsers = exploreUsers.filter((user) => {
      if (!sessionUser) return true;
      return String(user._id) !== String(sessionUser._id);
    });

    const filteredProjects = projects.filter((project) => {
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

    return renderApp(res, "explore", {
      pageTitle: "Explore",
      activeNav: "explore",
      user: sessionUser,

      projects: filteredProjects,
      exploreUsers: filteredUsers,

      exploreUsersTotal: matchingUsers.length,
      exploreProjectsTotal: filteredProjects.length,

      exploreSearchQuery: query,
      exploreStatusFilter: status,
      exploreRoleFilter: role,
      exploreIncludeDevelopers: includeDevelopers,
      exploreActiveTab: activeTab,

      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/dashboard");
  }
};