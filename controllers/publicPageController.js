const User = require("../models/mongo/User");
const Review = require("../models/mongo/Review");
const mongoose = require("mongoose");
const reviewService = require("../services/reviewService");
const certificationService = require("../services/certificationService");
const projectService = require("../services/projectService");
const { content } = require("../utils/viewRenderer");
const mapperService = require("../services/mapperService");
const { REVIEW_STATUSES, CERTIFICATION_STATUSES } = require("../constants/statusConstants");

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
    const profileKey = String(req.params.username || "").trim().toLowerCase();

    if (profileKey === "me" && req.currentUser) {
      return res.redirect(`/user/${req.currentUser.username || req.currentUser._id}`);
    }

    let user = await User.findOne({ username: profileKey }).populate("skills");

    if (!user) {
      user = await User.findOne({
        email: new RegExp(`^${profileKey}@`, "i"),
      }).populate("skills");
    }

    if (!user && mongoose.Types.ObjectId.isValid(profileKey)) {
      user = await User.findById(profileKey).populate("skills");
    }

    if (!user) {
      return exports.notFound(req, res);
    }

    const projects = await projectService.getAllProjects({ userId: user._id });
    const mappedProjects = projects.map(mapperService.mapProject);
    const reviews = await reviewService.getAllReviews({ reviewerId: user._id });

    const projectIds = projects.map((project) => project._id);
    const projectReviews = projectIds.length > 0
      ? await Review.find({ project: { $in: projectIds }, status: REVIEW_STATUSES.PUBLISHED })
      : [];
    const wouldHireRate = projectReviews.length > 0
      ? Math.round((projectReviews.filter((review) => review.wouldHire).length / projectReviews.length) * 100)
      : 0;

    const reviewsCount = reviews.length;

    const certifications = await certificationService.getAllRequests();
    const pendingCertificationsCount = certifications.filter(
      (c) => c.status === CERTIFICATION_STATUSES.PENDING
    ).length;

    const normalizedUser = mapperService.mapUser(user);
    normalizedUser.wouldHireRate = wouldHireRate;

    return res.render("pages/public-profile", {
      pageTitle: `${user.name} | DevRank`,
      bodyClass: "public-body",
      user: normalizedUser,
      currentUser: req.currentUser || null,
      isLoggedIn: Boolean(req.currentUser),

      projects: mappedProjects,
      reviews,
      reviewsCount,
      pendingCertificationsCount,

      ...content,
    });
  } catch (error) {
    return exports.notFound(req, res);
  }
};
