const User = require("../models/mongo/User");

function getCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}

async function attachCurrentUser(req, res, next) {
  try {
    const cookies = getCookies(req);
    const userId = cookies.devrank_user;

    if (!userId) {
      req.currentUser = null;
      return next();
    }

    try {
      const user = await User.findById(userId).populate("skills");
      req.currentUser = user || null;
    } catch (dbError) {
      console.error("[Auth] Error finding user:", dbError.message);
      req.currentUser = null;
    }
    return next();
  } catch (error) {
    console.error("[Auth] Error in attachCurrentUser:", error.message);
    req.currentUser = null;
    return next();
  }
}

function requireAuth(req, res, next) {
  if (!req.currentUser) {
    return res.redirect("/login");
  }
  return next();
}

function requireGuest(req, res, next) {
  if (!req.currentUser) {
    return next();
  }

  if (req.currentUser.role === "admin") {
    return res.redirect("/admin");
  }

  return res.redirect("/dashboard");
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.currentUser) {
      return res.redirect("/login");
    }

    if (!roles.includes(req.currentUser.role)) {
      return res.redirect("/dashboard");
    }

    return next();
  };
}

module.exports = {
  getCookies,
  attachCurrentUser,
  requireAuth,
  requireGuest,
  requireRole,
};
