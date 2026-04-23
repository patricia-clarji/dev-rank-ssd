const projectService = require("../services/projectService");
const skillService = require("../services/skillService");
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

exports.projects = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const query = String(req.query.q || "").trim().toLowerCase();
    const status = String(req.query.status || "all").trim();

    const projects = await projectService.getProjectsByUser(sessionUser._id);
    const filteredProjects = projects
      .filter((project) => (status === "all" ? true : String(project.status || "draft") === status))
      .filter((project) => {
        if (!query) return true;
        const haystack = [project.title, project.description, ...(project.techStack || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "projects", {
      pageTitle: "Projects",
      activeNav: "projects",
      user: sessionUser,
      projects: filteredProjects,
      allProjects: projects,
      projectsSearchQuery: query,
      projectsStatusFilter: status,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/dashboard");
  }
};

exports.newProject = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const skills = await skillService.getAllSkills({});
    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "project-form", {
      pageTitle: "New project",
      activeNav: "projects",
      formMode: "create",
      project: null,
      user: sessionUser,
      skills,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/projects");
  }
};

exports.createProject = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const techStack = parseCsv(req.body.techStackCsv);

    await projectService.createProject({
      userId: sessionUser._id,
      title: req.body.title,
      description: req.body.description,
      repoUrl: req.body.repoUrl,
      liveUrl: req.body.liveUrl,
      techStack,
      status: req.body.status || "seeking-review",
    });

    return res.redirect("/projects");
  } catch (error) {
    return res.redirect("/projects/new");
  }
};

exports.projectDetail = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const project = await projectService.getProject(req.params.id);
    const reviews = await projectService.getProjectReviews(req.params.id);
    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "project-detail", {
      pageTitle: project.title,
      activeNav: "projects",
      user: sessionUser,
      project: mapProject(project),
      reviews,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/projects");
  }
};

exports.editProject = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const project = await projectService.getProject(req.params.id);

    if (!isOwner(project, sessionUser._id) && sessionUser.role !== "admin") {
      return res.redirect(`/projects/${req.params.id}`);
    }

    const skills = await skillService.getAllSkills({});
    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "project-form", {
      pageTitle: `Edit ${project.title}`,
      activeNav: "projects",
      formMode: "edit",
      project: mapProject(project),
      user: sessionUser,
      skills,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/projects");
  }
};

exports.updateProject = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const project = await projectService.getProject(req.params.id);

    if (!isOwner(project, sessionUser._id) && sessionUser.role !== "admin") {
      return res.redirect(`/projects/${req.params.id}`);
    }

    const techStack = parseCsv(req.body.techStackCsv);
    await projectService.updateProject(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      repoUrl: req.body.repoUrl,
      liveUrl: req.body.liveUrl,
      techStack,
      status: req.body.status,
    });

    return res.redirect(`/projects/${req.params.id}`);
  } catch (error) {
    return res.redirect(`/projects/${req.params.id}/edit`);
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const project = await projectService.getProject(req.params.id);

    if (!isOwner(project, sessionUser._id) && sessionUser.role !== "admin") {
      return res.redirect(`/projects/${req.params.id}`);
    }

    await projectService.deleteProject(req.params.id);
    return res.redirect("/projects");
  } catch (error) {
    return res.redirect(`/projects/${req.params.id}`);
  }
};
