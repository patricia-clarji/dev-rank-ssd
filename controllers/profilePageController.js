const Review = require("../models/mongo/Review");
const projectService = require("../services/projectService");
const skillService = require("../services/skillService");
const userService = require("../services/userService");
const { renderApp, getUserFlags } = require("../utils/viewRenderer");
const profileViewModel = require("../utils/viewModels/profileViewModel");
const { sanitizeText, sanitizeUrl, parseCsv } = require("../utils/stringUtils");
const {
  fetchUserData,
  handleControllerError
} = require("../utils/controllerUtils");

async function renderProfileForm(req, res, { pageTitle, activeNav, actionPath, submitLabel, cancelPath, profileMode, errorRedirectPath, errorPrefix }) {
  const sessionUser = req.currentUser;
  const skills = await skillService.getAllSkills({});
  const { projects, reviews, certifications } = await fetchUserData(sessionUser);
  const userFlags = getUserFlags(sessionUser);
  const profileVM = profileViewModel.mapUserProfileView(
    sessionUser,
    projects,
    reviews,
    certifications,
    userFlags.isReviewer
  );

  return renderApp(res, "profile-edit", {
    pageTitle,
    activeNav,
    user: sessionUser,
    skills,
    projects,
    reviews,
    certificationRequests: certifications,
    isReviewer: userFlags.isReviewer,
    isAdmin: userFlags.isAdmin,
    profileMode,
    profileActionPath: actionPath,
    profileSubmitLabel: submitLabel,
    profileCancelPath: cancelPath,
    ...profileVM,
  });
}

exports.profile = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const { projects, reviews,certifications } = await fetchUserData(sessionUser);
    const userFlags = getUserFlags(sessionUser);
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, projects, reviews, certifications, userFlags.isReviewer);

    return renderApp(res, "profile", {
      pageTitle: "Your profile",
      activeNav: "profile",
      user: sessionUser,
      projects,
      reviews,
      certificationRequests: certifications,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/dashboard", "Profile render failed:");
  }
};

exports.editProfile = async (req, res) => {
  try {
    return renderProfileForm(req, res, {
      pageTitle: "Edit profile",
      activeNav: "settings",
      actionPath: "/profile/edit",
      submitLabel: "Save changes",
      cancelPath: "/profile",
      profileMode: "edit",
    });
  } catch (error) {
    return handleControllerError(error, res, "/profile", "Edit profile render failed:");
  }
};

exports.completeProfile = async (req, res) => {
  try {
    return renderProfileForm(req, res, {
      pageTitle: "Complete profile",
      activeNav: "settings",
      actionPath: "/profile/complete",
      submitLabel: "Complete profile",
      cancelPath: null,
      profileMode: "complete",
    });
  } catch (error) {
    return handleControllerError(error, res, "/dashboard", "Complete profile render failed:");
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const skillInputs = parseCsv(req.body.skillsCsv);

    await userService.updateUser(sessionUser._id, {
      name: sanitizeText(req.body.name),
      bio: sanitizeText(req.body.bio),
      company: sanitizeText(req.body.company),
      location: sanitizeText(req.body.location),
      githubUrl: sanitizeUrl(req.body.github),
      linkedin: sanitizeUrl(req.body.linkedin),
      website: sanitizeUrl(req.body.website),
    });

    if (skillInputs.length > 0) {
      const existingSkills = new Set((sessionUser.skills || []).map((skill) => String(skill.name || skill)));
      const newSkills = skillInputs.filter((skillName) => !existingSkills.has(skillName));

      if (newSkills.length > 0) {
        await userService.addSkills(sessionUser._id, newSkills);
      }
    }

    return res.redirect(req.body.profileMode === "complete" ? "/dashboard" : "/profile");
  } catch (error) {
    return handleControllerError(error, res, req.body.profileMode === "complete" ? "/profile/complete" : "/profile/edit", "Update profile failed:");
  }
};
