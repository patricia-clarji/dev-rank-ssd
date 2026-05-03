const projectService = require("../services/projectService");
const skillService = require("../services/skillService");
const Review = require("../models/mongo/Review");
const { renderApp } = require("../utils/viewRenderer");
const mapperService = require("../services/mapperService");
const { sanitizeText, sanitizeUrl, parseCsv } = require("../utils/stringUtils");
const { mapProjectDetailReviewCard } = require("../utils/viewModels/projectViewModel");
const projectViewModel = require("../utils/viewModels/projectViewModel");
const { getUserFlags } = require("../utils/viewRenderer");
const profileViewModel = require("../utils/viewModels/profileViewModel");
const {
  fetchUserData,
  handleControllerError,
  isProjectOwner
} = require("../utils/controllerUtils");
const { PROJECT_STATUSES, FILTER_STATUSES } = require("../constants/statusConstants");

exports.projects = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const queryRaw = String(req.query.q || "").trim();
    const query = queryRaw.toLowerCase();
    const status = String(req.query.status || FILTER_STATUSES.ALL).trim();

    const { projects, reviews, certifications } = await fetchUserData(sessionUser);
    const queryMatchedProjects = projects.filter((project) => {
      if (!query) return true;
      const haystack = [project.title, project.description, ...(project.techStack || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    const filteredProjects = queryMatchedProjects
      .filter((project) => (status === FILTER_STATUSES.ALL ? true : String(project.status || PROJECT_STATUSES.DRAFT) === status));

    const mappedProjects = filteredProjects.map(mapperService.mapProject);
    const mappedQueryMatchedProjects = queryMatchedProjects.map(mapperService.mapProject);
    const projectsList = projectViewModel.mapProjectsListItems(mappedProjects, projects);
    const filterCounts = projectViewModel.mapProjectsFilterCounts(mappedQueryMatchedProjects, status);
    const userFlags = getUserFlags(sessionUser);
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, projects, reviews, certifications, userFlags.isReviewer);

    return renderApp(res, "projects", {
      pageTitle: "Projects",
      activeNav: "projects",
      user: sessionUser,
      projects: projectsList,
      projectsSearchQuery: queryRaw,
      projectsStatusFilter: status,
      filterCounts,
      certificationRequests: certifications,
      reviews,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/dashboard", "Projects page render failed:");
  }
};

exports.newProject = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const skills = await skillService.getAllSkills({});
    const { projects, reviews, certifications } = await fetchUserData(sessionUser);
    const userFlags = getUserFlags(sessionUser);
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, projects, reviews, certifications, userFlags.isReviewer);

    return renderApp(res, "project-form", {
      pageTitle: "New project",
      activeNav: "projects",
      formMode: "create",
      project: null,
      user: sessionUser,
      skills,
      projects,
      reviews,
      certificationRequests: certifications,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/projects", "New project form render failed:");
  }
};

exports.createProject = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const techStack = parseCsv(req.body.techStackCsv);

    await projectService.createProject({
      userId: sessionUser._id,
      title: sanitizeText(req.body.title),
      description: sanitizeText(req.body.description),
      repoUrl: sanitizeUrl(req.body.repoUrl),
      liveUrl: sanitizeUrl(req.body.liveUrl),
      techStack,
      status: sanitizeText(req.body.status) || PROJECT_STATUSES.SEEKING_REVIEW,
    });

    return res.redirect("/projects");
  } catch (error) {
    return handleControllerError(error, res, "/projects/new", "Create project failed:");
  }
};

exports.projectDetail = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const project = await projectService.getProject(req.params.id);
    const reviews = await projectService.getProjectReviews(req.params.id);
    const projectReviewCards = reviews.map((reviewDoc) =>
      mapProjectDetailReviewCard(reviewDoc, sessionUser)
    );

    const { projects: userProjects, reviews: userReviews, certifications } = await fetchUserData(sessionUser);
    const userFlags = getUserFlags(sessionUser);
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
      certificationRequests: certifications,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/projects", "Project detail render failed:");
  }
};

exports.editProject = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const project = await projectService.getProject(req.params.id);

    if (!isProjectOwner(project, sessionUser._id) && sessionUser.role !== "admin") {
      return res.redirect(`/projects/${req.params.id}`);
    }

    const skills = await skillService.getAllSkills({});
    const { projects: userProjects, reviews: userReviews, certifications } = await fetchUserData(sessionUser);
    const userFlags = getUserFlags(sessionUser);
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, userProjects, userReviews, certifications, userFlags.isReviewer);

    return renderApp(res, "project-form", {
      pageTitle: `Edit ${project.title}`,
      activeNav: "projects",
      formMode: "edit",
      user: sessionUser,
      project: mapperService.mapProject(project),
      skills,
      projects: userProjects,
      reviews: userReviews,
      certificationRequests: certifications,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/projects", "Edit project form render failed:");
  }
};

exports.updateProject = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const project = await projectService.getProject(req.params.id);

    if (!isProjectOwner(project, sessionUser._id) && sessionUser.role !== "admin") {
      return res.redirect(`/projects/${req.params.id}`);
    }

    const techStack = parseCsv(req.body.techStackCsv);
    await projectService.updateProject(req.params.id, {
      title: sanitizeText(req.body.title),
      description: sanitizeText(req.body.description),
      repoUrl: sanitizeUrl(req.body.repoUrl),
      liveUrl: sanitizeUrl(req.body.liveUrl),
      techStack,
      status: sanitizeText(req.body.status),
    });

    return res.redirect(`/projects/${req.params.id}`);
  } catch (error) {
    return handleControllerError(error, res, `/projects/${req.params.id}/edit`, "Update project failed:");
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const project = await projectService.getProject(req.params.id);

    if (!isProjectOwner(project, sessionUser._id) && sessionUser.role !== "admin") {
      return res.redirect(`/projects/${req.params.id}`);
    }

    await projectService.deleteProject(req.params.id);
    return res.redirect("/projects");
  } catch (error) {
    return handleControllerError(error, res, `/projects/${req.params.id}`, "Delete project failed:");
  }
};
