const projectService = require("../services/projectService");
const asyncHandler = require("../middleware/asyncHandler");

// Create a new project
exports.createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body);
  res.status(201).json({ message: "Project created successfully.", project });
});

// Get all projects
exports.getAllProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getAllProjects(req.query);
  res.status(200).json({ projects });
});

// Get project by ID
exports.getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProject(req.params.projectId);
  res.status(200).json({ project });
});

// Update project
exports.updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.projectId, req.body);
  res.status(200).json({ message: "Project updated successfully.", project });
});

// Delete project
exports.deleteProject = asyncHandler(async (req, res) => {
  const result = await projectService.deleteProject(req.params.projectId);
  res.status(200).json(result);
});

// Get reviews for a project
exports.getProjectReviews = asyncHandler(async (req, res) => {
  const reviews = await projectService.getProjectReviews(req.params.projectId);
  res.status(200).json(reviews);
});

// Get project by title
exports.getProjectByTitle = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectByTitle(req.params.title);
  res.status(200).json({ project });
});

// Get all projects by a specific user
exports.getProjectsByUser = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjectsByUser(req.params.userId);
  res.status(200).json({ projects });
});




