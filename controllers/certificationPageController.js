const certificationService = require("../services/certificationService");
const reviewService = require("../services/reviewService");
const projectService = require("../services/projectService");
const { getUserFlags, renderApp } = require("../utils/viewRenderer");
const profileViewModel = require("../utils/viewModels/profileViewModel");
const certificationViewModel = require("../utils/viewModels/certificationViewModel");
const mapperService = require("../services/mapperService");
const ERROR_CODES = require("../utils/errorCodes");
const { fetchUserData } = require("../utils/controllerUtils");
const { sanitizeText, sanitizeUrl, parseCsv } = require("../utils/stringUtils");
const CERTIFICATION_ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION]: "Please complete all required certification fields with valid information.",
  [ERROR_CODES.DUPLICATE]: "You already have a certification request or an approved certification.",
  [ERROR_CODES.NOT_FOUND]: "We couldn't find your user account.",
  default: "We couldn't submit your certification request. Please try again.",
};

exports.applyCertification = async (req, res) => {
  const sessionUser = req.currentUser;
  const userFlags = getUserFlags(sessionUser);

  if (userFlags.isReviewer) {
    return res.redirect("/certifications");
  }

  const ownCertificationRecord = await certificationService.getRequestByUserId(sessionUser._id);
  if (
    ownCertificationRecord &&
    (
      ownCertificationRecord.status === "pending" ||
      ownCertificationRecord.status === "approved"
    )
  ) {
    return res.redirect("/certifications");
  }

  const ownCertification = ownCertificationRecord
    ? mapperService.mapCertification(ownCertificationRecord)
    : null;

  const projects = await projectService.getProjectsByUser(sessionUser._id);
  const { reviews: receivedReviews } = await fetchUserData(sessionUser);
  const certifications = await certificationService.getAllRequests();
  
  const profileVM = profileViewModel.mapUserProfileView(
    sessionUser,
    projects,
    receivedReviews,
    ownCertification ? [ownCertification] : [],
    userFlags.isReviewer
  );

  return renderApp(res, "certification-apply", {
    pageTitle: "Apply for certification",
    activeNav: "certifications",
    user: sessionUser,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
    projects,
    reviews: [],
    ...profileVM,
    ownCertification,
    certificationRequests: certifications,
    certificationErrorMessage: CERTIFICATION_ERROR_MESSAGES[req.query.error] || null,
  });
};

exports.submitCertification = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const userFlags = getUserFlags(sessionUser);

    if (userFlags.isReviewer) {
      return res.redirect("/certifications");
    }

    await certificationService.apply({
      userId: sessionUser._id,
      cvUrl: sanitizeUrl(req.body.cvUrl),
      linkedinProfile: sanitizeUrl(req.body.linkedinProfile),
      experience: sanitizeText(req.body.experience),
      motivation: sanitizeText(req.body.motivation),
      techExpertise: parseCsv(req.body.techExpertiseCsv),
    });

    return res.redirect("/certifications");
  } catch (error) {
    const errorCode = error?.errorCode || "default";
    return res.redirect(`/certifications/apply?error=${encodeURIComponent(errorCode)}`);

  }
};

exports.certifications = async (req, res) => {
  try {
    const sessionUser = req.currentUser;

    const allRequests = await certificationService.getAllRequests();
    const ownCertificationRecord = await certificationService.getRequestByUserId(sessionUser._id);
    const ownCertification = ownCertificationRecord
      ? mapperService.mapCertification(ownCertificationRecord)
      : null;

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
    const projects = await projectService.getProjectsByUser(sessionUser._id);
    const { reviews: receivedReviews } = await fetchUserData(sessionUser);

    const profileVM = profileViewModel.mapUserProfileView(
      sessionUser,
      projects,
      receivedReviews,
      ownCertification ? [ownCertification] : [],
      userFlags.isReviewer
    );
    const certBenefits = certificationViewModel.mapCertificationBenefits();

    return renderApp(res, "certifications", {
      pageTitle: "Certifications",
      activeNav: "certifications",
      user: sessionUser,
      ownCertification,
      certificationStatus: ownCertification ? ownCertification.status : null,
      certBenefits,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      projects,
      reviews: givenReviews,
      ...profileVM,
      certificationRequests: allRequests,
      reviewsGiven,
      avgRatingGiven,
      wouldHireCount,
    });
  } catch (error) {
    console.error("Certifications page render failed:", error);
    return res.redirect("/dashboard");
  }
};