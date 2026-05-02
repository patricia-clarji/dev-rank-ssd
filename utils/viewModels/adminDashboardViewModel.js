/**
 * Admin Dashboard View-Model
 * Computes UI state for admin dashboard (stats, activity entries)
 */

const { CERTIFICATION_STATUSES, PROJECT_STATUSES } = require("../../constants/statusConstants");

exports.mapAdminStats = (users, projects, reviews, certificationRequests, activityLogs) => {
  const usersList = users || [];
  const projectsList = projects || [];
  const reviewsList = reviews || [];
  const certsList = certificationRequests || [];
  const activityEntries = activityLogs || [];

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const usersToday = usersList.filter(
    (userItem) => userItem.createdAt && new Date(userItem.createdAt) >= startOfToday
  ).length;

  const reviewsTodayCount = activityEntries.filter((entry) => {
    const timestamp = entry.timestamp || entry.createdAt;
    return (
      String(entry.entity || "").toLowerCase() === "review" &&
      timestamp &&
      new Date(timestamp) >= startOfToday
    );
  }).length;

  return {
    totalUsers: usersList.length,
    totalProjects: projectsList.filter((project) => project.status !== PROJECT_STATUSES.DRAFT).length,
    totalReviews: reviewsList.length,
    pendingCerts: certsList.filter((request) => request.status === CERTIFICATION_STATUSES.PENDING).length,
    newUsersToday: usersToday,
    reviewsToday: reviewsTodayCount,
  };
};

exports.mapActivityEntries = (activityLogs) => {
  if (!activityLogs || !Array.isArray(activityLogs)) {
    return [];
  }

  return activityLogs.map((entry) => {
    const actionText = (entry.action || "").toLowerCase();
    const activityType = actionText.includes("user")
      ? "user"
      : actionText.includes("project")
        ? "project"
        : actionText.includes("cert")
          ? "cert"
          : actionText.includes("review")
            ? "review"
            : "project";

    return {
      _id: entry._id,
      actorName: entry.actorName || entry.actor,
      action: entry.action,
      actionLabel: entry.actionLabel || entry.action,
      target: entry.target,
      targetLabel: entry.targetLabel || entry.target,
      entity: entry.entity,
      timestamp: entry.timestamp || entry.createdAt,
      createdAt: entry.createdAt,
      activityType,
    };
  });
};

exports.mapPendingCertifications = (certificationRequests) => {
  if (!certificationRequests || !Array.isArray(certificationRequests)) {
    return [];
  }

  return certificationRequests
    .filter((request) => request.status === CERTIFICATION_STATUSES.PENDING)
    .map((request) => {
      return {
        _id: request._id,
        name: (request.user && request.user.name) || request.name || "Applicant",
        username: (request.user && request.user.username) || request.username || "user",
        submittedAt: request.submittedAt
          ? new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(new Date(request.submittedAt))
          : "",
      };
    });
};
