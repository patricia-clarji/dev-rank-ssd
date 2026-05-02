const mapperService = require("../../services/mapperService");

function getInitials(name) {
  return String(name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mapProjectDetailReviewCard(reviewDoc, sessionUser, isAdmin) {
  const review = mapperService.mapReview(reviewDoc) || {};
  const reviewer = review.reviewer || {};
  const reviewerId = reviewer._id || reviewer;
  const projectId = review.projectId || (review.project && review.project._id ? String(review.project._id) : "");
  const canEdit = Boolean(
    isAdmin || (sessionUser && sessionUser._id && reviewerId && String(sessionUser._id) === String(reviewerId))
  );

  return {
    ...review,
    reviewerName: reviewer.name || "Reviewer",
    reviewerUsername: reviewer.username || "reviewer",
    reviewerInitials: getInitials(reviewer.name),
    feedbackText: review.feedback || review.note || "No written feedback provided.",
    suggestionsList: Array.isArray(review.suggestions) && review.suggestions.length
      ? review.suggestions
      : [],
    displayDate: review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "N/A",
    canEdit,
    editUrl: `/reviews/${review._id}/edit`,
    deleteUrl: `/reviews/${review._id}/delete`,
    deleteReturnTo: `/projects/${projectId}`,
  };
}

/**
 * Project Detail View-Model
 * Computes UI state for project detail page
 */
function mapProjectDetailPage(project, currentUser, isAdmin, isReviewer) {
  const currentProject = project || {};
  const projectOwner = currentProject.owner || {};
  const isOwner = Boolean(
    currentUser._id &&
      projectOwner._id &&
      String(currentUser._id) === String(projectOwner._id)
  );
  const canModify = isOwner || isAdmin;

  return {
    currentProject,
    projectOwner,
    isOwner,
    canModify,
    baseRating: Number(currentProject.averageRating || 0),
    codeQuality: Number(currentProject.codeQualityAvg || currentProject.averageRating || 0),
    creativity: Number(currentProject.creativityAvg || currentProject.averageRating || 0),
    cleanCode: Number(currentProject.cleanCodeAvg || currentProject.averageRating || 0),
  };
}

function mapProjectDetailReviewCards(reviews) {
  if (!reviews || !Array.isArray(reviews)) {
    return [];
  }

  return reviews.map((review) => {
    const wouldHire = review.wouldHire || false;
    return {
      ...review,
      wouldHire,
    };
  });
}

function mapProjectDetailStats(reviews) {
  const projectReviews = reviews || [];
  const wouldHireCount = projectReviews.filter((r) => r.wouldHire).length;

  return {
    wouldHireCount,
    totalReviews: projectReviews.length,
  };
}

/**
 * Projects List View-Model
 * Computes UI state for projects listing page
 */
function mapProjectsListItems(projects, allProjects) {
  if (!projects || !Array.isArray(projects)) {
    return [];
  }

  return projects.map((project) => {
    const projectStatus = project.status || "draft";
    const statusClass =
      projectStatus === "reviewed"
        ? "badge badge-success"
        : projectStatus === "seeking-review"
          ? "badge badge-warning"
          : "badge badge-secondary";
    const statusLabel =
      projectStatus === "reviewed"
        ? "Reviewed"
        : projectStatus === "seeking-review"
          ? "Seeking Review"
          : "Draft";
    const formattedDate = project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "N/A";

    return {
      _id: project._id,
      title: project.title,
      description: project.description,
      techStack: project.techStack || [],
      status: projectStatus,
      statusClass,
      statusLabel,
      reviewCount: project.reviewCount || 0,
      averageRating: project.averageRating || 0,
      hasReviews: (project.reviewCount || 0) > 0,
      createdAt: project.createdAt,
      formattedDate,
    };
  });
}

function mapProjectsFilterCounts(projects, statusFilter) {
  const allCount = (projects || []).length;
  const reviewedCount = (projects || []).filter((p) => (p.status || "draft") === "reviewed").length;
  const seekingReviewCount = (projects || []).filter((p) => (p.status || "draft") === "seeking-review").length;

  return [
    { value: "all", label: "All", count: allCount, isActive: (statusFilter || "all") === "all" },
    { value: "reviewed", label: "Reviewed", count: reviewedCount, isActive: statusFilter === "reviewed" },
    { value: "seeking-review", label: "Seeking Review", count: seekingReviewCount, isActive: statusFilter === "seeking-review" },
  ];
}

module.exports = {
  mapProjectDetailReviewCard,
  mapProjectDetailPage,
  mapProjectDetailReviewCards,
  mapProjectDetailStats,
  mapProjectsListItems,
  mapProjectsFilterCounts,
};