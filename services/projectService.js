const Project = require("../models/mongo/Project");
const Review = require("../models/mongo/Review");
const User = require("../models/mongo/User");
const projectLogger = require("../loggers/projectLogger");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");

const recalculateUserProfileScore = async (userId) => {
    const ownedProjects = await Project.find({ user: userId });

    if (ownedProjects.length === 0) {
        await User.findByIdAndUpdate(userId, { profileScore: 0 });
        return;
    }

    const scoredProjects = ownedProjects.filter(
        (p) => typeof p.aggregateRating === "number" && p.totalReviews > 0
    );

    if (scoredProjects.length === 0) {
        await User.findByIdAndUpdate(userId, { profileScore: 0 });
        return;
    }

    const avg =
        scoredProjects.reduce((sum, p) => sum + p.aggregateRating, 0) /
        scoredProjects.length;

    await User.findByIdAndUpdate(userId, {
        profileScore: Number(avg.toFixed(2)),
    });
};

exports.recalculateUserProfileScore = recalculateUserProfileScore;

exports.createProject = async ({ userId, title, description, repoUrl, liveUrl, techStack, status }) => {
    const ownerUser = await User.findById(userId);
    if (!ownerUser) {
        throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
    }

    const project = await Project.create({
        user: userId,
        title,
        description,
        repoUrl,
        liveUrl,
        techStack,
        status,
    });

    projectLogger.logProjectCreated(ownerUser._id.toString(), project._id.toString(), project.title, project.status);

    return await project.populate("user", "name email role githubUrl");
};

exports.getAllProjects = async (filters = {}) => {
    const query = {};

    if (filters.userId) {
        const userExists = await User.findById(filters.userId);
        if (!userExists) {
            throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
        }
        query.user = filters.userId;
    }

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.techStack) {
        const techs = Array.isArray(filters.techStack)
            ? filters.techStack
            : [filters.techStack];
        query.techStack = { $all: techs };
    }

    return await Project.find(query)
        .populate("user", "name email role githubUrl")
        .sort({ createdAt: -1 });
};

exports.getProject = async (projectId) => {
    const project = await Project.findById(projectId).populate(
        "user",
        "name email role githubUrl"
    );

    if (!project) {
        throw new AppError("Project not found.", 404, ERROR_CODES.NOT_FOUND);
    }

    return project;
};

exports.updateProject = async (projectId, { title, description, repoUrl, liveUrl, techStack, status }) => {
    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            title,
            description,
            repoUrl,
            liveUrl,
            techStack,
            status,
        },
        { returnDocument: "after", runValidators: true }
    ).populate("user", "name email role githubUrl");

    if (!project) {
        throw new AppError("Project not found.", 404, ERROR_CODES.NOT_FOUND);
    }

    projectLogger.logProjectUpdated(project.user._id.toString(), project._id.toString(), project.title, project.status);

    return project;
};


async function cleanupProjectData(project) {
    // Delete the project
    await Project.findByIdAndDelete(project._id);
    // Delete related reviews
    await Review.deleteMany({ project: project._id });
    // Recalculate user's profile score directly
    await recalculateUserProfileScore(project.user);
}

exports.deleteProject = async (projectId) => {
    const project = await Project.findById(projectId).populate("user", "email");
    if (!project) {
        throw new AppError("Project not found.", 404, ERROR_CODES.NOT_FOUND);
    }
    await cleanupProjectData(project);

    projectLogger.logProjectDeleted(project.user._id.toString(), project._id.toString(), project.title);
    return { message: "Project deleted successfully." };
};

exports.getProjectReviews = async (projectId) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new AppError("Project not found.", 404, ERROR_CODES.NOT_FOUND);
    }

    return await Review.find({ project: projectId })
        .populate("reviewer", "name email role githubUrl")
        .populate("project", "title status")
        .sort({ createdAt: -1 });
};

exports.getProjectByTitle = async (title) => {
    const project = await Project.findOne({ title })
        .populate("user", "name email role githubUrl");

    if (!project) {
        throw new AppError("Project not found.", 404, ERROR_CODES.NOT_FOUND);
    }

    return project;
};

exports.getProjectsByUser = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
    }

    return await Project.find({ user: userId })
        .populate("user", "name email role githubUrl")
        .sort({ createdAt: -1 });
};