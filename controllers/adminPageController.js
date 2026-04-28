const User = require("../models/mongo/User");
const Project = require("../models/mongo/Project");
const Review = require("../models/mongo/Review");
const CertificationRequest = require("../models/mongo/CertificationRequest");
const projectService = require("../services/projectService");
const reviewService = require("../services/reviewService");
const certificationService = require("../services/certificationService");
const activityLogService = require("../services/activityLogService");
const mapperService = require("../services/mapperService");
const { renderApp } = require("../utils/viewRenderer");
const { toActionLabel, isObjectId } = require("../utils/stringUtils");

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

    return renderApp(res, "admin-dashboard", {
      pageTitle: "Admin dashboard",
      activeNav: "admin-dashboard",
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
    const statusValues = ["pending", "approved", "rejected", "all"];
    const statusFilter = statusValues.includes(req.query.status) ? req.query.status : "pending";

    const [certifications, projects] = await Promise.all([
      certificationService.getAllRequests(),
      projectService.getAllProjects({}),
    ]);

    const certificationRequests = certifications.filter((request) => {
      if (statusFilter === "all") return true;
      return String(request.status || "").toLowerCase() === statusFilter;
    });

    const certificationCounts = {
      pending: certifications.filter((request) => String(request.status || "").toLowerCase() === "pending").length,
      approved: certifications.filter((request) => String(request.status || "").toLowerCase() === "approved").length,
      rejected: certifications.filter((request) => String(request.status || "").toLowerCase() === "rejected").length,
      all: certifications.length,
    };

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

// Skills management functions
exports.adminSkills = async (req, res) => {
  try {
    const skillService = require("../services/skillService");
    const q = String(req.query.q || "").trim().toLowerCase();
    const category = String(req.query.category || "").trim();
    const page = parseInt(req.query.page) || 1;
    const limit = 20; // Skills per page
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

    return renderApp(res, "admin-skills", {
      pageTitle: "Manage Skills",
      activeNav: "admin",
      user: req.currentUser,
      skills: paginatedSkills,
      skillSearchQuery: q,
      skillCategoryFilter: category,
      currentPage: page,
      totalPages,
      totalSkills,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      isAdmin: true,
      isReviewer: true,
    });
  } catch (error) {
    console.error("Admin skills render failed:", error);
    return res.redirect("/admin");
  }
};

exports.newSkillForm = async (req, res) => {
  try {
    return renderApp(res, "admin-skill-new", {
      pageTitle: "Add New Skill",
      activeNav: "admin",
      user: req.currentUser,
      isAdmin: true,
      isReviewer: true,
    });
  } catch (error) {
    console.error("New skill form render failed:", error);
    return res.redirect("/admin/skills");
  }
};

exports.createSkill = async (req, res) => {
  try {
    const skillService = require("../services/skillService");
    const { name, category, isPreset } = req.body;

    // Handle multiple categories from checkboxes
    const categories = Array.isArray(category) ? category : [category].filter(Boolean);

    await skillService.createSkill({
      name: String(name || "").trim(),
      category: categories,
      isPreset: isPreset === "on" || isPreset === true,
    });

    return res.redirect("/admin/skills");
  } catch (error) {
    console.error("Create skill failed:", error);
    return res.redirect("/admin/skills/new");
  }
};

exports.editSkillForm = async (req, res) => {
  try {
    const skillService = require("../services/skillService");
    const skill = await skillService.getSkill(req.params.id);

    if (!skill) {
      return res.redirect("/admin/skills");
    }

    return renderApp(res, "admin-skill-edit", {
      pageTitle: "Edit Skill",
      activeNav: "admin",
      user: req.currentUser,
      skill,
      isAdmin: true,
      isReviewer: true,
    });
  } catch (error) {
    console.error("Edit skill form render failed:", error);
    return res.redirect("/admin/skills");
  }
};

exports.updateSkill = async (req, res) => {
  try {
    const skillService = require("../services/skillService");
    const { name, category, isPreset } = req.body;

    // Handle multiple categories from checkboxes
    const categories = Array.isArray(category) ? category : [category].filter(Boolean);

    await skillService.updateSkill(req.params.id, {
      name: String(name || "").trim(),
      category: categories,
      isPreset: isPreset === "on" || isPreset === true,
    });

    return res.redirect("/admin/skills");
  } catch (error) {
    console.error("Update skill failed:", error);
    return res.redirect(`/admin/skills/${req.params.id}/edit`);
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const skillService = require("../services/skillService");
    await skillService.deleteSkill(req.params.id);
    return res.redirect("/admin/skills");
  } catch (error) {
    console.error("Delete skill failed:", error);
    return res.redirect("/admin/skills");
  }
};
