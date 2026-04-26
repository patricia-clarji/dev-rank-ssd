const certificationService = require("../services/certificationService");
const reviewService = require("../services/reviewService");
const { getUserFlags, renderApp } = require("../utils/viewRenderer");

function parseCsv(csvValue) {
  return String(csvValue || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

exports.certifications = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const allRequests = await certificationService.getAllRequests();
    const certifications = allRequests.filter((request) => {
      const requestUserId = request && request.user && request.user._id;
      return requestUserId && String(requestUserId) === String(sessionUser._id);
    });
    const latestRequest = certifications[0] || null;
    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "certifications", {
      pageTitle: "Certifications",
      activeNav: "certifications",
      user: sessionUser,
      certifications,
      certificationStatus: latestRequest ? latestRequest.status : null,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/dashboard");
  }
};

exports.applyCertification = async (req, res) => {
  const sessionUser = req.currentUser;
  const userFlags = getUserFlags(sessionUser);

  // Prevent reviewers and admins from applying for certification
  if (userFlags.isReviewer) {
    return res.redirect("/certifications");
  }

  return renderApp(res, "certification-apply", {
    pageTitle: "Apply for certification",
    activeNav: "certifications",
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
  });
};

exports.submitCertification = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const userFlags = getUserFlags(sessionUser);

    // Prevent reviewers and admins from submitting certification
    if (userFlags.isReviewer) {
      return res.redirect("/certifications");
    }

    await certificationService.apply({
      userId: sessionUser._id,
      cvUrl: req.body.cvUrl,
      experience: req.body.experience,
      motivation: req.body.motivation,
      techExpertise: parseCsv(req.body.techExpertiseCsv),
    });

    return res.redirect("/certifications");
  } catch (error) {
    return res.redirect("/certifications/apply");
  }
};

exports.certifications = async (req, res) => {
  try {
    const sessionUser = req.currentUser;

    const allRequests = await certificationService.getAllRequests();
    const certifications = allRequests.filter((request) => {
      const requestUserId = request && request.user && request.user._id;
      return requestUserId && String(requestUserId) === String(sessionUser._id);
    });

    const latestRequest = certifications[0] || null;

    const givenReviews = await reviewService.getAllReviews({
      reviewerId: sessionUser._id,
    });

    const reviewsGiven = givenReviews.length;

    const avgRatingGiven =
      reviewsGiven > 0
        ? Number(
            (
              givenReviews.reduce((sum, r) => sum + r.overallRating, 0) /
              reviewsGiven
            ).toFixed(2)
          )
        : 0;

    const wouldHireCount = givenReviews.filter((r) => r.wouldHire).length;

    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "certifications", {
      pageTitle: "Certifications",
      activeNav: "certifications",
      user: sessionUser,
      certifications,
      certificationStatus: latestRequest ? latestRequest.status : null,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,

      // dynamic stats
      reviewsGiven,
      avgRatingGiven,
      wouldHireCount,
    });
  } catch (error) {
    return res.redirect("/dashboard");
  }
};
