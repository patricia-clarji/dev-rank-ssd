const projectService = require("../services/projectService");
const skillService = require("../services/skillService");
const Review = require("../models/mongo/Review");
const { getUserFlags, renderApp } = require("../utils/viewRenderer");  
const mapperService = require("../services/mapperService");
const { parseCsv } = require("../utils/stringUtils");
const { mapProjectDetailReviewCard } = require("../utils/viewModels/projectViewModel");
const profileViewModel = require("../utils/viewModels/profileViewModel");
const certificationService = require("../services/certificationService");
const projectViewModel = require("../utils/viewModels/projectViewModel");

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
    const projectIds = projects.map((p) => p._id);
    const reviews = projectIds.length > 0
      ? await Review.find({ project: { $in: projectIds }, status: "published" })
          .populate("project", "title")
          .populate("reviewer", "name")
      : [];
    const certifications = await certificationService.getAllRequests();
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, projects, reviews, certifications, userFlags.isReviewer);
    const mappedProjects = filteredProjects.map(mapperService.mapProject);
    const projectsList = projectViewModel.mapProjectsListItems(mappedProjects, projects);
    const filterCounts = projectViewModel.mapProjectsFilterCounts(mappedProjects, status);

    return renderApp(res, "projects", {
      pageTitle: "Projects",
      activeNav: "projects",
      user: sessionUser,
      projects: projectsList,
      projectsSearchQuery: query,
      projectsStatusFilter: status,
      filterCounts,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
      certificationRequests: certifications,
      reviews,
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
    const projects = await projectService.getProjectsByUser(sessionUser._id);
    const projectIds = projects.map((p) => p._id);
    const userReviews = projectIds.length > 0
      ? await Review.find({ project: { $in: projectIds }, status: "published" })
          .populate("project", "title")
          .populate("reviewer", "name")
      : [];
    const certifications = await certificationService.getAllRequests();
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, projects, userReviews, certifications, userFlags.isReviewer);

    return renderApp(res, "project-form", {
      pageTitle: "New project",
      activeNav: "projects",
      formMode: "create",
      project: null,
      user: sessionUser,
      skills,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      projects,
      reviews: userReviews,
      ...profileVM,
      certificationRequests: certifications,
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
    const projectReviewCards = reviews.map((reviewDoc) =>
      mapProjectDetailReviewCard(reviewDoc, sessionUser, userFlags.isAdmin)
    );
    const userProjects = await projectService.getProjectsByUser(sessionUser._id);
    const userProjectIds = userProjects.map((p) => p._id);
    const userReviews = userProjectIds.length > 0
      ? await Review.find({ project: { $in: userProjectIds }, status: "published" })
          .populate("project", "title")
          .populate("reviewer", "name")
      : [];
    const certifications = await certificationService.getAllRequests();
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, userProjects, userReviews, certifications, userFlags.isReviewer);
    const mappedProject = mapperService.mapProject(project);
    const projectDetailVM = projectViewModel.mapProjectDetailPage(mappedProject, sessionUser, userFlags.isAdmin, userFlags.isReviewer);
    const reviewStats = projectViewModel.mapProjectDetailStats(projectReviewCards);

    return renderApp(res, "project-detail", {
      pageTitle: project.title,
      activeNav: "projects",
      user: sessionUser,
      project: mappedProject,
      projectDetailVM,
      projectReviewCards,
      reviewStats,
      reviews,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
      certificationRequests: certifications,
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
    const userProjects = await projectService.getProjectsByUser(sessionUser._id);
    const userProjectIds = userProjects.map((p) => p._id);
    const userReviews = userProjectIds.length > 0
      ? await Review.find({ project: { $in: userProjectIds }, status: "published" })
          .populate("project", "title")
          .populate("reviewer", "name")
      : [];
    const certifications = await certificationService.getAllRequests();
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, userProjects, userReviews, certifications, userFlags.isReviewer);

    return renderApp(res, "project-form", {
      pageTitle: `Edit ${project.title}`,
      activeNav: "projects",
      formMode: "edit",
      project: mapperService.mapProject(project),
      user: sessionUser,
      skills,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      projects: userProjects,
      reviews: userReviews,
      ...profileVM,
      certificationRequests: certifications,
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
