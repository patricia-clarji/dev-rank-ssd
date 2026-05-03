const User = require("../models/mongo/User");
const Project = require("../models/mongo/Project");
const Review = require("../models/mongo/Review");
const CertificationRequest = require("../models/mongo/CertificationRequest");
const projectService = require("../services/projectService");
const reviewService = require("../services/reviewService");
const userService = require("../services/userService");
const certificationService = require("../services/certificationService");
const activityLogService = require("../services/activityLogService");
const mapperService = require("../services/mapperService");
const { getUserFlags, renderApp } = require("../utils/viewRenderer");
const { toActionLabel, isObjectId } = require("../utils/stringUtils");
const certificationViewModel = require("../utils/viewModels/certificationViewModel");
const profileViewModel = require("../utils/viewModels/profileViewModel");
const adminDashboardViewModel = require("../utils/viewModels/adminDashboardViewModel");
const { CERTIFICATION_STATUSES, FILTER_STATUSES } = require("../constants/statusConstants");
const { handleControllerError } = require("../utils/controllerUtils");

exports.adminUsers = async (req, res) => {
  try {
    const qRaw = String(req.query.q || "").trim();
    const q = qRaw.toLowerCase();
    const roleFilter = String(req.query.role || "all").trim().toLowerCase();

    const users = await User.find().select("-passwordHash").populate("skills");
    const filteredUsers = users.filter((userItem) => {
      const matchesRole = roleFilter === "all" || String(userItem.role || "").toLowerCase() === roleFilter;
      const searchable = [userItem.name, userItem.username, userItem.email, userItem.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !q || searchable.includes(q);
      return matchesRole && matchesQuery;
    });

    const roleStats = {
      total: filteredUsers.length,
      developers: filteredUsers.filter((userItem) => userItem.role === "developer").length,
      reviewers: filteredUsers.filter((userItem) => userItem.role === "reviewer").length,
      admins: filteredUsers.filter((userItem) => userItem.role === "admin").length,
      superAdmins: filteredUsers.filter((userItem) => userItem.isSuperAdmin).length,
    };

    const userFlags = getUserFlags(req.currentUser);
    const reviews = await reviewService.getAllReviews({});
    const certifications = await certificationService.getAllRequests();
    const profileVM = profileViewModel.mapUserProfileView(req.currentUser, [], [], [], userFlags.isReviewer);


    return renderApp(res, "admin-users", {
      pageTitle: "Manage users",
      activeNav: "admin-users",
      user: req.currentUser,
      users: filteredUsers.map((userItem) => mapperService.mapUser(userItem)),
      roleSearchQuery: qRaw,
      roleFilter,
      roleStats,
      projects: [],
      reviews: [],
      certificationRequests: certifications,
      isAdmin: true,
      isReviewer: true,
      isSuperAdmin: true,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/admin", "Admin users render failed:");
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    await userService.updateUserRole({
      actorId: req.currentUser._id,
      targetUserId: req.params.id,
      newRole: req.body.role,
    });

    return res.redirect("/admin/users");
  } catch (error) {
    return res.redirect("/admin/users");
  }
};

exports.adminDashboard = async (req, res) => {
  try {
    const [users, projects, reviews, certifications, rawActivityLogs] = await Promise.all([
      User.find().populate("skills"),
      projectService.getAllProjects({}),
      reviewService.getAllReviews({}),
      certificationService.getAllRequests(),
      activityLogService.getAllLogs({}),
    ]);
    const activityLogs = await activityLogService.buildFriendlyActivityLogs(rawActivityLogs);
    const userFlags = getUserFlags(req.currentUser);

    const certificationsMapped = (certifications || []).map((cert) =>
      certificationViewModel.mapCertificationRequestCard(cert, projects, cert.user, true)
    );
    const profileVM = profileViewModel.mapUserProfileView(req.currentUser, projects, reviews, certifications, userFlags.isReviewer);
    const adminStats = adminDashboardViewModel.mapAdminStats(users, projects, reviews, certifications, activityLogs);
    const recentActivity = adminDashboardViewModel.mapActivityEntries(activityLogs).slice(0, 5);
    const pendingCerts = adminDashboardViewModel.mapPendingCertifications(certifications);

    return renderApp(res, "admin-dashboard", {
      pageTitle: "Admin dashboard",
      activeNav: "admin-dashboard",
      user: req.currentUser,
      users,
      projects,
      reviews,
      certifications: certificationsMapped,
      certificationRequests: certificationsMapped,
      activityLogs,
      adminStats,
      recentActivity,
      pendingCerts,
      isAdmin: true,
      isReviewer: true,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/dashboard", "Admin dashboard render failed:");
  }
};

exports.adminCertifications = async (req, res) => {
  try {
    const statusValues = [CERTIFICATION_STATUSES.PENDING, CERTIFICATION_STATUSES.APPROVED, CERTIFICATION_STATUSES.REJECTED, FILTER_STATUSES.ALL];
    const statusFilter = statusValues.includes(req.query.status) ? req.query.status : CERTIFICATION_STATUSES.PENDING;

    const [certifications, projects] = await Promise.all([
      certificationService.getAllRequests(),
      projectService.getAllProjects({}),
    ]);
    const userFlags = getUserFlags(req.currentUser);

    const certificationRequestsRaw = certifications.filter((request) => {
      if (statusFilter === FILTER_STATUSES.ALL) return true;
      return String(request.status || "").toLowerCase() === statusFilter;
    });

    const certificationRequests = (certificationRequestsRaw || []).map((req) =>
      certificationViewModel.mapCertificationRequestCard(req, projects, req.user, true)
    );

    const certificationCounts = {
      pending: certifications.filter((request) => String(request.status || "").toLowerCase() === CERTIFICATION_STATUSES.PENDING).length,
      approved: certifications.filter((request) => String(request.status || "").toLowerCase() === CERTIFICATION_STATUSES.APPROVED).length,
      rejected: certifications.filter((request) => String(request.status || "").toLowerCase() === CERTIFICATION_STATUSES.REJECTED).length,
      all: certifications.length,
    };
    const profileVM = profileViewModel.mapUserProfileView(req.currentUser, projects, [], certifications, userFlags.isReviewer);

    return renderApp(res, "admin-certifications", {
      pageTitle: "Certification requests",
      activeNav: "admin",
      user: req.currentUser,
      certificationRequests,
      certifications,
      certificationCounts,
      statusFilter,
      projects,
      isAdmin: true,
      isReviewer: true,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/admin", "Admin certifications render failed:");
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
    const qRaw = String(req.query.q || "").trim();
    const q = qRaw.toLowerCase();
    const action = String(req.query.action || "").trim();
    const entity = String(req.query.entity || "").trim();

    const rawLogs = await activityLogService.getAllLogs({
      action: action || undefined,
      entity: entity || undefined,
    });
    const friendlyLogs = await activityLogService.buildFriendlyActivityLogs(rawLogs);

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

    const userFlags = getUserFlags(req.currentUser);
    const projects = [];
    const profileVM = profileViewModel.mapUserProfileView(req.currentUser, projects, [], [], userFlags.isReviewer);

    const certifications = await certificationService.getAllRequests();
    return renderApp(res, "admin-logs", {
      pageTitle: "Activity logs",
      activeNav: "admin",
      user: req.currentUser,
      activityLogs: logs,
      logsSearchQuery: qRaw,
      logsActionFilter: action,
      logsEntityFilter: entity,
      isAdmin: true,
      isReviewer: true,
      projects,
      reviews: [],
      certificationRequests: certifications,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/admin", "Admin logs render failed:");
  }
};

exports.adminSkills = async (req, res) => {
  try {
    const skillService = require("../services/skillService");
    const qRaw = String(req.query.q || "").trim();
    const q = qRaw.toLowerCase();
    const category = String(req.query.category || "").trim().toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const allSkills = await skillService.getAllSkills({
      category: category || undefined,
    });

    const filteredSkills = q
      ? allSkills.filter((skill) => {
        const haystack = [
          skill.name,
          skill.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      : allSkills;

    const totalSkills = filteredSkills.length;
    const totalPages = Math.ceil(totalSkills / limit);
    const paginatedSkills = filteredSkills.slice(skip, skip + limit);
    const userFlags = getUserFlags(req.currentUser);
    const projects = [];
    const profileVM = profileViewModel.mapUserProfileView(req.currentUser, projects, [], [], userFlags.isReviewer);

    const certifications = await certificationService.getAllRequests();
    return renderApp(res, "admin-skills", {
      pageTitle: "Manage Skills",
      activeNav: "admin",
      user: req.currentUser,
      skills: paginatedSkills,
      skillSearchQuery: qRaw,
      skillCategoryFilter: category,
      currentPage: page,
      totalPages,
      totalSkills,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      isAdmin: true,
      isReviewer: true,
      projects,
      reviews: [],
      certificationRequests: certifications,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/admin", "Admin skills render failed:");
  }
};

exports.newSkillForm = async (req, res) => {
  try {
    const userFlags = getUserFlags(req.currentUser);
    const projects = [];
    const profileVM = profileViewModel.mapUserProfileView(req.currentUser, projects, [], [], userFlags.isReviewer);

    const certifications = await certificationService.getAllRequests();
    return renderApp(res, "admin-skill-new", {
      pageTitle: "Add New Skill",
      activeNav: "admin",
      user: req.currentUser,
      isAdmin: true,
      isReviewer: true,
      projects,
      reviews: [],
      certificationRequests: certifications,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/admin/skills", "New skill form render failed:");
  }
};

exports.createSkill = async (req, res) => {
  try {
    const skillService = require("../services/skillService");
    const { name, category, isPreset } = req.body;

    const categories = Array.isArray(category) ? category : [category].filter(Boolean);

    await skillService.createSkill({
      name: String(name || "").trim(),
      category: categories,
      isPreset: isPreset === "on" || isPreset === true,
      userId: req.currentUser._id,
    });

    return res.redirect("/admin/skills");
  } catch (error) {
    return handleControllerError(error, res, "/admin/skills/new", "Create skill failed:");
  }
};

exports.editSkillForm = async (req, res) => {
  try {
    const skillService = require("../services/skillService");
    const skill = await skillService.getSkill(req.params.id);

    if (!skill) {
      return res.redirect("/admin/skills");
    }

    const userFlags = getUserFlags(req.currentUser);
    const projects = [];
    const profileVM = profileViewModel.mapUserProfileView(req.currentUser, projects, [], [], userFlags.isReviewer);

    const certifications = await certificationService.getAllRequests();
    return renderApp(res, "admin-skill-edit", {
      pageTitle: "Edit Skill",
      activeNav: "admin",
      user: req.currentUser,
      skill,
      isAdmin: true,
      isReviewer: true,
      projects,
      reviews: [],
      certificationRequests: certifications,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/admin/skills", "Edit skill form render failed:");
  }
};

exports.updateSkill = async (req, res) => {
  try {
    const skillService = require("../services/skillService");
    const { name, category, isPreset } = req.body;

    const categories = Array.isArray(category) ? category : [category].filter(Boolean);

    await skillService.updateSkill(req.params.id, {
      name: String(name || "").trim(),
      category: categories,
      isPreset: isPreset === "on" || isPreset === true,
      userId: req.currentUser._id,
    });

    return res.redirect("/admin/skills");
  } catch (error) {
    return handleControllerError(error, res, `/admin/skills/${req.params.id}/edit`, "Update skill failed:");
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const skillService = require("../services/skillService");
    await skillService.deleteSkill(req.params.id, req.currentUser._id);
    return res.redirect("/admin/skills");
  } catch (error) {
    return handleControllerError(error, res, "/admin/skills", "Delete skill failed:");
  }
};
