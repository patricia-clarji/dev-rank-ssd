const User = require("../models/mongo/User");
const Project = require("../models/mongo/Project");
const Review = require("../models/mongo/Review");
const CertificationRequest = require("../models/mongo/CertificationRequest");
const projectService = require("../services/projectService");
const reviewService = require("../services/reviewService");
const certificationService = require("../services/certificationService");
const activityLogService = require("../services/activityLogService");
const { renderApp } = require("./viewModel");

function toActionLabel(action) {
  return String(action || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ""));
}

async function buildFriendlyActivityLogs(logs) {
  const userIds = new Set();
  const projectIds = new Set();
  const reviewIds = new Set();
  const certificationIds = new Set();

  logs.forEach((log) => {
    if (isObjectId(log.userId)) userIds.add(String(log.userId));

    const entity = String(log.entity || "").toLowerCase();
    if (entity === "project" && isObjectId(log.entityId)) projectIds.add(String(log.entityId));
    if (entity === "review" && isObjectId(log.entityId)) reviewIds.add(String(log.entityId));
    if (entity === "certificationrequest" && isObjectId(log.entityId)) certificationIds.add(String(log.entityId));
    if (entity === "user" && isObjectId(log.entityId)) userIds.add(String(log.entityId));

    const metadata = log.metadata || {};
    if (isObjectId(metadata.projectId)) projectIds.add(String(metadata.projectId));
    if (isObjectId(metadata.followerId)) userIds.add(String(metadata.followerId));
    if (isObjectId(metadata.targetId)) userIds.add(String(metadata.targetId));
  });

  const [users, projects, reviews, certifications] = await Promise.all([
    userIds.size > 0
      ? User.find({ _id: { $in: Array.from(userIds) } }).select("name username")
      : [],
    projectIds.size > 0
      ? Project.find({ _id: { $in: Array.from(projectIds) } }).select("title")
      : [],
    reviewIds.size > 0
      ? Review.find({ _id: { $in: Array.from(reviewIds) } })
          .select("overallRating")
          .populate("project", "title")
      : [],
    certificationIds.size > 0
      ? CertificationRequest.find({ _id: { $in: Array.from(certificationIds) } }).populate("user", "name username")
      : [],
  ]);

  const userMap = new Map(users.map((user) => [String(user._id), user]));
  const projectMap = new Map(projects.map((project) => [String(project._id), project]));
  const reviewMap = new Map(reviews.map((review) => [String(review._id), review]));
  const certMap = new Map(certifications.map((request) => [String(request._id), request]));

  return logs.map((log) => {
    const metadata = log.metadata || {};
    const actorUser = userMap.get(String(log.userId || ""));
    const actorName = metadata.actorName || (actorUser && (actorUser.name || actorUser.username)) || "System";
    const entity = String(log.entity || "").toLowerCase();

    let targetLabel = metadata.title || metadata.name || metadata.target || "";

    if (!targetLabel && entity === "project") {
      const project = projectMap.get(String(log.entityId || metadata.projectId || ""));
      targetLabel = project ? project.title : "Project";
    }

    if (!targetLabel && entity === "review") {
      const review = reviewMap.get(String(log.entityId || ""));
      targetLabel = review ? `Review for ${(review.project && review.project.title) || "Project"}` : "Review";
    }

    if (!targetLabel && entity === "certificationrequest") {
      const request = certMap.get(String(log.entityId || ""));
      targetLabel = request && request.user
        ? `Certification request by ${request.user.name || request.user.username || "user"}`
        : "Certification request";
    }

    if (!targetLabel && entity === "user") {
      const targetUser = userMap.get(String(log.entityId || metadata.targetId || ""));
      targetLabel = targetUser ? (targetUser.name || targetUser.username) : "User";
    }

    const entityLabel = entity === "certificationrequest" 
      ? "Certification" 
      : (entity ? entity.charAt(0).toUpperCase() + entity.slice(1) : "Record");

    return {
      ...log,
      actionLabel: toActionLabel(log.action),
      actorName,
      entity: entityLabel,
      targetLabel: targetLabel || entityLabel || "Record",
      detailsText: metadata.adminNotes || metadata.status || metadata.role || "",
    };
  });
}

exports.adminDashboard = async (req, res) => {
  try {
    const [users, projects, reviews, certifications, rawActivityLogs] = await Promise.all([
      User.find().populate("skills"),
      projectService.getAllProjects({}),
      reviewService.getAllReviews({}),
      certificationService.getAllRequests(),
      activityLogService.getAllLogs({}),
    ]);
    const activityLogs = await buildFriendlyActivityLogs(rawActivityLogs);

    return renderApp(res, "admin-dashboard", {
      pageTitle: "Admin dashboard",
      activeNav: "admin",
      user: req.currentUser,
      users,
      projects,
      reviews,
      certifications,
      activityLogs,
      isAdmin: true,
      isReviewer: true,
    });
  } catch (error) {
    console.error("Admin dashboard render failed:", error);
    return res.redirect("/dashboard");
  }
};

exports.adminCertifications = async (req, res) => {
  try {
    const [certifications, projects] = await Promise.all([
      certificationService.getAllRequests(),
      projectService.getAllProjects({}),
    ]);

    return renderApp(res, "admin-certifications", {
      pageTitle: "Certification requests",
      activeNav: "admin",
      user: req.currentUser,
      certifications,
      projects,
      isAdmin: true,
      isReviewer: true,
    });
  } catch (error) {
    console.error("Admin certifications render failed:", error);
    return res.redirect("/admin");
  }
};

exports.approveCertification = async (req, res) => {
  try {
    await certificationService.approve(req.params.id, req.body.adminNotes || "Approved via admin dashboard");
    return res.redirect("/admin/certifications");
  } catch (error) {
    return res.redirect("/admin/certifications");
  }
};

exports.rejectCertification = async (req, res) => {
  try {
    await certificationService.reject(req.params.id, req.body.adminNotes || "Rejected via admin dashboard");
    return res.redirect("/admin/certifications");
  } catch (error) {
    return res.redirect("/admin/certifications");
  }
};

exports.adminLogs = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const action = String(req.query.action || "").trim();
    const entity = String(req.query.entity || "").trim();

    const rawLogs = await activityLogService.getAllLogs({
      action: action || undefined,
      entity: entity || undefined,
    });
    const friendlyLogs = await buildFriendlyActivityLogs(rawLogs);

    const logs = q
      ? friendlyLogs.filter((entry) => {
          const haystack = [
            entry.action,
            entry.actionLabel,
            entry.entity,
            entry.actorName,
            entry.targetLabel,
            entry.detailsText,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : friendlyLogs;

    return renderApp(res, "admin-logs", {
      pageTitle: "Activity logs",
      activeNav: "admin",
      user: req.currentUser,
      activityLogs: logs,
      logsSearchQuery: q,
      logsActionFilter: action,
      logsEntityFilter: entity,
      isAdmin: true,
      isReviewer: true,
    });
  } catch (error) {
    console.error("Admin logs render failed:", error);
    return res.redirect("/admin");
  }
};
