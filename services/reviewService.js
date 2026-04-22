const Review = require("../models/mongo/Review");
const Project = require("../models/mongo/Project");
const User = require("../models/mongo/User");
const reviewLogger = require("../loggers/reviewLogger");
const { recalculateUserProfileScore } = require("./projectService");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");

const calculateAverage = (reviews, field) => {
    if (reviews.length === 0) return 0;

    const total = reviews.reduce((sum, review) => sum + review[field], 0);
    return Number((total / reviews.length).toFixed(2));
};

const recalculateProjectAggregates = async (projectId) => {
    const reviews = await Review.find({
        project: projectId,
        status: "published",
    });

    const totalReviews = reviews.length;

    const aggregateRating = calculateAverage(reviews, "overallRating");
    const aggregateCodeQuality = calculateAverage(reviews, "codeQualityScore");
    const aggregateCreativity = calculateAverage(reviews, "creativityScore");
    const aggregateCleanCode = calculateAverage(reviews, "cleanCodeScore");
    const hireVotes = reviews.filter((r) => r.wouldHire === true).length;

    await Project.findByIdAndUpdate(projectId, {
        aggregateRating,
        aggregateCodeQuality,
        aggregateCreativity,
        aggregateCleanCode,
        totalReviews,
        hireVotes,
        status: totalReviews > 0 ? "reviewed" : "seeking-review",
    });
};

exports.createReview = async ({ projectId, reviewerId, overallRating, codeQualityScore, creativityScore, cleanCodeScore, wouldHire, generalFeedback, suggestions, status }) => {
    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
        throw new AppError("Project not found.", 404, ERROR_CODES.NOT_FOUND);
    }

    const existingReviewer = await User.findById(reviewerId);
    if (!existingReviewer) {
        throw new AppError("Reviewer user not found.", 404, ERROR_CODES.NOT_FOUND);
    }

    if (!existingReviewer.isVerifiedReviewer || existingReviewer.role !== "reviewer") {
        throw new AppError("Only verified reviewers can submit reviews.", 403, ERROR_CODES.FORBIDDEN);
    }

    if (existingProject.user.toString() === reviewerId.toString()) {
        throw new AppError("Project owners cannot review their own projects.", 403, ERROR_CODES.FORBIDDEN);
    }

    const alreadyReviewed = await Review.findOne({ project: projectId, reviewer: reviewerId });
    if (alreadyReviewed) {
        throw new AppError("This reviewer has already reviewed this project.", 409, ERROR_CODES.DUPLICATE);
    }

    const review = await Review.create({
        project: projectId,
        reviewer: reviewerId,
        overallRating,
        codeQualityScore,
        creativityScore,
        cleanCodeScore,
        wouldHire,
        generalFeedback,
        suggestions,
        status
    });

    await recalculateProjectAggregates(projectId);
    await recalculateUserProfileScore(existingProject.user);

    reviewLogger.logReviewCreated(existingReviewer._id.toString(), review._id.toString(), projectId.toString(), overallRating, status);

    return await review.populate([
        { path: "project", select: "title status" },
        { path: "reviewer", select: "name email role githubUrl" },
    ]);
};

exports.getAllReviews = async (filters = {}) => {
    const query = {};

    if (filters.projectId) query.project = filters.projectId;
    if (filters.reviewerId) query.reviewer = filters.reviewerId;
    if (filters.status) query.status = filters.status;

    return await Review.find(query)
        .populate("project", "title status")
        .populate("reviewer", "name email role githubUrl")
        .sort({ createdAt: -1 });
};

exports.getReview = async (reviewId) => {
    const review = await Review.findById(reviewId)
        .populate("project", "title status")
        .populate("reviewer", "name email role githubUrl");

    if (!review) {
        throw new AppError("Review not found.", 404, ERROR_CODES.NOT_FOUND);
    }

    return review;
};

exports.updateReview = async (reviewId, { overallRating, codeQualityScore, creativityScore, cleanCodeScore, wouldHire, generalFeedback, suggestions, status}) => {
    const review = await Review.findByIdAndUpdate(
        reviewId,
        {
            overallRating,
            codeQualityScore,
            creativityScore,
            cleanCodeScore,
            wouldHire,
            generalFeedback,
            suggestions,
            status
        },
        { returnDocument: "after", runValidators: true }
    )

    if (!review) {
        throw new AppError("Review not found.", 404, ERROR_CODES.NOT_FOUND);
    }

    await recalculateProjectAggregates(review.project);

    const updatedProject = await Project.findById(review.project);
    if (updatedProject?.user) {
        await recalculateUserProfileScore(updatedProject.user);
    }

    const populatedReview = await Review.findById(review._id)
        .populate("project", "title status")
        .populate("reviewer", "name email role githubUrl");

    reviewLogger.logReviewUpdated(populatedReview.reviewer._id.toString(), review._id.toString(), review.project.toString(), review.status);

    return populatedReview;
};

exports.deleteReview = async (reviewId) => {
    const review = await Review.findById(reviewId).populate("reviewer", "email");

    if (!review) {
        throw new AppError("Review not found.", 404, ERROR_CODES.NOT_FOUND);
    }

    await Review.findByIdAndDelete(reviewId);

    await recalculateProjectAggregates(review.project);

    const affectedProject = await Project.findById(review.project);
    if (affectedProject?.user) {
        await recalculateUserProfileScore(affectedProject.user);
    }

    reviewLogger.logReviewDeleted(review.reviewer._id.toString(), review._id.toString(), review.project.toString());

    return { message: "Review deleted successfully." };
};