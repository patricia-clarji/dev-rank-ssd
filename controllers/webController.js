const content = require("../views/data/siteContent");

const defaultUser = content.demoUsers.developer;
const reviewerUser = content.demoUsers.reviewer;
const adminUser = content.demoUsers.admin;

const demoAuthUsers = {
  developer: { username: "developer", password: "password123", user: defaultUser },
  reviewer: { username: "reviewer", password: "password123", user: reviewerUser },
  admin: { username: "admin", password: "admin123", user: adminUser },
};

function getCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}

function getSessionUser(req, fallbackUser = defaultUser) {
  const cookies = getCookies(req);
  const userKey = cookies.devrank_user;
  const sessionUser = content.demoUsers[userKey];
  return sessionUser || fallbackUser;
}

function getUserFlags(user) {
  return {
    isReviewer: user.role === "reviewer" || user.role === "admin",
    isAdmin: user.role === "admin",
  };
}

function renderApp(res, page, options = {}) {
  const user = options.user || defaultUser;
  const userFlags = getUserFlags(user);

  res.render("pages/app", {
    pageTitle: options.pageTitle || "DevRank",
    bodyClass: "app-body",
    page,
    user,
    isReviewer: options.isReviewer ?? userFlags.isReviewer,
    isAdmin: options.isAdmin ?? userFlags.isAdmin,
    activeNav: options.activeNav || "dashboard",
    ...content,
    ...options,
  });
}

exports.landing = (req, res) => {
  res.render("pages/landing", {
    pageTitle: "Build your verified developer profile",
    bodyClass: "landing-body",
    ...content,
  });
};

exports.loginPage = (req, res) => {
  res.render("pages/auth", {
    pageTitle: "Sign in",
    bodyClass: "auth-body",
    mode: "login",
    ...content,
  });
};

exports.registerPage = (req, res) => {
  res.render("pages/auth", {
    pageTitle: "Create account",
    bodyClass: "auth-body",
    mode: "register",
    ...content,
  });
};

exports.dashboard = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);

  if (sessionUser.role === "admin") {
    return res.redirect("/admin");
  }

  const userFlags = getUserFlags(sessionUser);
  renderApp(res, "dashboard", {
    pageTitle: "Dashboard",
    activeNav: "dashboard",
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.profile = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);
  const userFlags = getUserFlags(sessionUser);
  renderApp(res, "profile", {
    pageTitle: "Your profile",
    activeNav: "profile",
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.editProfile = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);
  const userFlags = getUserFlags(sessionUser);
  renderApp(res, "profile-edit", {
    pageTitle: "Edit profile",
    activeNav: "profile",
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.publicProfile = (req, res) => {
  const publicUser = content.publicProfiles[req.params.username] || content.publicProfiles.developer;

  res.render("pages/public-profile", {
    pageTitle: `${publicUser.name} | DevRank`,
    bodyClass: "public-body",
    user: publicUser,
    ...content,
  });
};

exports.projects = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);
  const userFlags = getUserFlags(sessionUser);
  renderApp(res, "projects", {
    pageTitle: "Projects",
    activeNav: "projects",
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.newProject = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);
  const userFlags = getUserFlags(sessionUser);
  renderApp(res, "project-form", {
    pageTitle: "New project",
    activeNav: "projects",
    formMode: "create",
    project: null,
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.projectDetail = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);
  const userFlags = getUserFlags(sessionUser);
  const project = content.projects.find((item) => item._id === req.params.id) || content.projects[0];

  renderApp(res, "project-detail", {
    pageTitle: project.title,
    activeNav: "projects",
    project,
    reviews: content.reviews.filter((review) => review.projectId === project._id),
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.editProject = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);
  const userFlags = getUserFlags(sessionUser);
  const project = content.projects.find((item) => item._id === req.params.id) || content.projects[0];

  renderApp(res, "project-form", {
    pageTitle: `Edit ${project.title}`,
    activeNav: "projects",
    formMode: "edit",
    project,
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.reviewProject = (req, res) => {
  const sessionUser = getSessionUser(req, reviewerUser);
  const userFlags = getUserFlags(sessionUser);
  const project = content.projects.find((item) => item._id === req.params.id) || content.projects[0];

  renderApp(res, "review-form", {
    pageTitle: `Review ${project.title}`,
    activeNav: "reviews",
    project,
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.reviews = (req, res) => {
  const sessionUser = getSessionUser(req, reviewerUser);
  const userFlags = getUserFlags(sessionUser);
  renderApp(res, "reviews", {
    pageTitle: "Reviews",
    activeNav: "reviews",
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.skills = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);
  const userFlags = getUserFlags(sessionUser);
  renderApp(res, "skills", {
    pageTitle: "Skills",
    activeNav: "skills",
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.skillDetail = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);
  const userFlags = getUserFlags(sessionUser);
  const skill = content.skills.find((item) => item._id === req.params.id) || content.skills[0];

  renderApp(res, "skill-detail", {
    pageTitle: skill.name,
    activeNav: "skills",
    skill,
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.certifications = (req, res) => {
  const sessionUser = getSessionUser(req, reviewerUser);
  const userFlags = getUserFlags(sessionUser);
  renderApp(res, "certifications", {
    pageTitle: "Certifications",
    activeNav: "certifications",
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.applyCertification = (req, res) => {
  const sessionUser = getSessionUser(req, reviewerUser);
  const userFlags = getUserFlags(sessionUser);
  renderApp(res, "certification-apply", {
    pageTitle: "Apply for certification",
    activeNav: "certifications",
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.explore = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);
  const userFlags = getUserFlags(sessionUser);
  renderApp(res, "explore", {
    pageTitle: "Explore",
    activeNav: "explore",
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.adminDashboard = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);
  if (sessionUser.role !== "admin") {
    return res.redirect("/dashboard");
  }

  renderApp(res, "admin-dashboard", {
    pageTitle: "Admin dashboard",
    activeNav: "admin",
    user: sessionUser,
    isAdmin: true,
    isReviewer: true,
  });
};

exports.adminCertifications = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);
  if (sessionUser.role !== "admin") {
    return res.redirect("/dashboard");
  }

  renderApp(res, "admin-certifications", {
    pageTitle: "Certification requests",
    activeNav: "admin",
    user: sessionUser,
    isAdmin: true,
    isReviewer: true,
  });
};

exports.adminLogs = (req, res) => {
  const sessionUser = getSessionUser(req, defaultUser);
  if (sessionUser.role !== "admin") {
    return res.redirect("/dashboard");
  }

  renderApp(res, "admin-logs", {
    pageTitle: "Activity logs",
    activeNav: "admin",
    user: sessionUser,
    isAdmin: true,
    isReviewer: true,
  });
};

exports.handleLogin = (req, res) => {
  const username = (req.body.username || "").trim().toLowerCase();
  const password = req.body.password || "";

  const authRecord = demoAuthUsers[username];
  if (!authRecord || authRecord.password !== password) {
    return res.redirect("/login");
  }

  res.cookie("devrank_user", encodeURIComponent(authRecord.user.username), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  if (authRecord.user.role === "admin") {
    return res.redirect("/admin");
  }

  return res.redirect("/dashboard");
};

exports.handleRegister = (req, res) => {
  res.cookie("devrank_user", encodeURIComponent(defaultUser.username), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return res.redirect("/dashboard");
};

exports.logout = (req, res) => {
  res.clearCookie("devrank_user");
  return res.redirect("/login");
};
exports.notFound = (req, res) => {
  res.status(404).render("pages/not-found", {
    pageTitle: "Page not found",
    bodyClass: "not-found-body",
    ...content,
  });
};