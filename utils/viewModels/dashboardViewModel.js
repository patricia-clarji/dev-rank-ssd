/**
 * Dashboard View-Model
 * Computes UI state for dashboard page (projects list, reviews list, seeking-review section)
 */

exports.mapDashboardProjects = (projects) => {
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
    };
  });
};

exports.mapDashboardReviews = (reviews) => {
  if (!reviews || !Array.isArray(reviews)) {
    return [];
  }

  return reviews.map((review) => {
    const reviewerName = (review.reviewer && review.reviewer.name) || "Reviewer";
    const reviewerInitials = reviewerName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const projectLabel =
      review.projectTitle || ((review.project && review.project.title) || "Project");
    const formattedDate = new Date(review.createdAt).toLocaleDateString();

    return {
      _id: review._id,
      reviewerName,
      reviewerInitials,
      projectLabel,
      overallRating: review.overallRating || 0,
      wouldHire: review.wouldHire || false,
      formattedDate,
    };
  });
};
