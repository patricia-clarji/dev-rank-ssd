/**
 * Reviews List View-Model
 * Computes UI state for reviews listing page
 */

exports.mapReceivedReviews = (reviews) => {
  if (!reviews || !Array.isArray(reviews)) {
    return [];
  }

  return reviews.map((review) => {
    const projectId = review.projectId || ((review.project && review.project._id) || "");
    const projectTitle = review.projectTitle || ((review.project && review.project.title) || "Project");
    const reviewerName = (review.reviewer && review.reviewer.name) || "Reviewer";
    const reviewerUsername = (review.reviewer && review.reviewer.username) || "reviewer";
    const formattedDate = new Date(review.createdAt).toLocaleDateString();

    return {
      _id: review._id,
      projectId,
      projectTitle,
      reviewerName,
      reviewerUsername,
      feedback: review.feedback || review.note || "No detailed feedback provided.",
      overallRating: review.overallRating || 0,
      wouldHire: review.wouldHire || false,
      createdAt: review.createdAt,
      formattedDate,
    };
  });
};

exports.mapGivenReviews = (reviews) => {
  if (!reviews || !Array.isArray(reviews)) {
    return [];
  }

  return reviews.map((review) => {
    const projectId = review.projectId || ((review.project && review.project._id) || "");
    const projectTitle = review.projectTitle || ((review.project && review.project.title) || "Project");
    const projectOwner = (review.project && review.project.owner) || {};
    const ownerUsername = projectOwner.username || "developer";
    const ownerName = projectOwner.name || "Developer";
    const formattedDate = new Date(review.createdAt).toLocaleDateString();

    return {
      _id: review._id,
      projectId,
      projectTitle,
      ownerUsername,
      ownerName,
      feedback: review.feedback || review.note || "No detailed feedback provided.",
      overallRating: review.overallRating || 0,
      wouldHire: review.wouldHire || false,
      createdAt: review.createdAt,
      formattedDate,
    };
  });
};
