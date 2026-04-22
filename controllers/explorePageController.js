const projectService = require("../services/projectService");
const userService = require("../services/userService");
const { getUserFlags, renderApp } = require("./viewModel");

exports.explore = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const query = String(req.query.q || "").trim().toLowerCase();
    const status = String(req.query.status || "all").trim();
    const includeDevelopers = req.query.developers === "1" || req.query.developers === "on";
    const activeTab = includeDevelopers ? "developers" : "projects";

    const projects = await projectService.getAllProjects({
      status: status !== "all" ? status : undefined,
    });
    const exploreUsers = await userService.getAllUsers();

    const filteredProjects = query
      ? projects.filter((project) => {
          const owner = project.user || {};
          const haystack = [
            project.title,
            project.description,
            ...(project.techStack || []),
            owner.name,
            owner.username,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        })
      : projects;

    const filteredUsers = includeDevelopers && query
      ? exploreUsers.filter((user) => {
          const haystack = [
            user.name,
            user.username,
            user.bio,
            ...(user.skills || []).map((skill) => (typeof skill === "string" ? skill : skill.name)),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        })
      : (includeDevelopers ? exploreUsers : []);

    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "explore", {
      pageTitle: "Explore",
      activeNav: "explore",
      user: sessionUser,
      projects: filteredProjects,
      exploreUsers: filteredUsers,
      exploreUsersTotal: exploreUsers.length,
      exploreProjectsTotal: projects.length,
      exploreSearchQuery: query,
      exploreStatusFilter: status,
      exploreIncludeDevelopers: includeDevelopers,
      exploreActiveTab: activeTab,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/dashboard");
  }
};
