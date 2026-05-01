// View rendering and preparation utilities
const content = require("../views/data/siteContent");
const mapperService = require("../services/mapperService");

function getUserFlags(user) {
  if (!user) {
    return { isReviewer: false, isAdmin: false, isSuperAdmin: false };
  }

  const isSuperAdmin = Boolean(user.isSuperAdmin);

  return {
    isReviewer: (user.role === "reviewer" && user.isVerifiedReviewer) || user.role === "admin" || isSuperAdmin,
    isAdmin: user.role === "admin" || isSuperAdmin,
    isSuperAdmin,
  };
}

function renderApp(res, page, options = {}) {
  const user = options.user || null;
  const normalizedUser = mapperService.mapUser(user);
  const userFlags = getUserFlags(normalizedUser);

  const projects = (options.projects || []).map(mapperService.mapProject).filter(Boolean);
  const reviews = (options.reviews || []).map(mapperService.mapReview).filter(Boolean);
  const skills = options.skills || [];
  const exploreUsers = (options.exploreUsers || options.users || []).map(mapperService.mapUser).filter(Boolean);
  const certificationRequests = Array.isArray(options.certificationRequests)
    ? options.certificationRequests
    : (options.certifications || []).map(mapperService.mapCertification).filter(Boolean);
  const activityLogs = (options.activityLogs || options.logs || []).map(mapperService.mapActivityLog).filter(Boolean);

  return res.render("pages/app", {
    ...content,
    ...options,
    pageTitle: options.pageTitle || "DevRank",
    bodyClass: "app-body",
    page,
    user: normalizedUser,
    projects,
    reviews,
    skills,
    exploreUsers,
    certificationRequests,
    activityLogs,
    isReviewer: options.isReviewer ?? userFlags.isReviewer,
    isAdmin: options.isAdmin ?? userFlags.isAdmin,
    isSuperAdmin: options.isSuperAdmin ?? userFlags.isSuperAdmin,
    activeNav: options.activeNav || "dashboard",
  });
}

module.exports = {
  content,
  getUserFlags,
  renderApp,
};
