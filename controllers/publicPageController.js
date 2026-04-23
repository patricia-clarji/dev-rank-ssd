const User = require("../models/mongo/User");
const { content, mapUser } = require("./viewModel");

exports.landing = (req, res) => {
  res.render("pages/landing", {
    pageTitle: "Build your verified developer profile",
    bodyClass: "landing-body",
    ...content,
  });
};

exports.notFound = (req, res) => {
  res.status(404).render("pages/not-found", {
    pageTitle: "Page not found",
    bodyClass: "not-found-body",
    ...content,
  });
};

exports.publicProfile = async (req, res) => {
  try {
    const username = String(req.params.username || "").toLowerCase();
    let user = await User.findOne({ username }).populate("skills");

    if (!user) {
      user = await User.findOne({ email: new RegExp(`^${username}@`, "i") }).populate("skills");
    }

    if (!user) {
      user = await User.findById(req.params.username).populate("skills");
    }

    if (!user) {
      return exports.notFound(req, res);
    }

    return res.render("pages/public-profile", {
      pageTitle: `${user.name} | DevRank`,
      bodyClass: "public-body",
      user: mapUser(user),
      currentUser: req.currentUser || null,
      isLoggedIn: Boolean(req.currentUser),
      ...content,
    });
  } catch (error) {
    return exports.notFound(req, res);
  }
};
