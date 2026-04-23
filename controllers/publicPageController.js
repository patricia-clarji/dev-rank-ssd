const User = require("../models/mongo/User");
const Review = require("../models/mongo/Review");
const reviewService = require("../services/reviewService");
const certificationService = require("../services/certificationService");
const projectService = require("../services/projectService");
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

    const projects = await projectService.getAllProjects({ userId: user._id });
    const reviews = await reviewService.getAllReviews({ reviewerId: user._id });

    const projectIds = projects.map((project) => project._id);
    const projectReviews = projectIds.length > 0
      ? await Review.find({ project: { $in: projectIds }, status: "published" })
      : [];
    const wouldHireRate = projectReviews.length > 0
      ? Math.round((projectReviews.filter((review) => review.wouldHire).length / projectReviews.length) * 100)
      : 0;

    const reviewsCount = reviews.length;

    const certifications = await certificationService.getAllRequests();
    const pendingCertificationsCount = certifications.filter(
      (c) => c.status === "pending"
    ).length;

    const normalizedUser = mapUser(user);
    normalizedUser.wouldHireRate = wouldHireRate;

    return res.render("pages/public-profile", {
      pageTitle: `${user.name} | DevRank`,
      bodyClass: "public-body",
      user: normalizedUser,
      currentUser: req.currentUser || null,
      isLoggedIn: Boolean(req.currentUser),

      projects,
      reviews,
      reviewsCount,
      pendingCertificationsCount,

      ...content,
    });
  } catch (error) {
    return exports.notFound(req, res);
  }
};
