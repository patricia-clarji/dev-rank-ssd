const Review = require("../models/mongo/Review");
const projectService = require("../services/projectService");
const skillService = require("../services/skillService");
const userService = require("../services/userService");
const { renderApp, getUserFlags } = require("../utils/viewRenderer");
const profileViewModel = require("../utils/viewModels/profileViewModel");
const {
  fetchUserData,
  handleControllerError
} = require("../utils/controllerUtils");

exports.profile = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const { projects, reviews } = await fetchUserData(sessionUser);
    const userFlags = getUserFlags(sessionUser);
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, projects, reviews, [], userFlags.isReviewer);

    return renderApp(res, "profile", {
      pageTitle: "Your profile",
      activeNav: "profile",
      user: sessionUser,
      projects,
      reviews,
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
    const sessionUser = req.currentUser;
    const skills = await skillService.getAllSkills({});
    const { projects, reviews } = await fetchUserData(sessionUser);
    const userFlags = getUserFlags(sessionUser);
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, projects, reviews, [], userFlags.isReviewer);

    return renderApp(res, "profile-edit", {
      pageTitle: "Edit profile",
      activeNav: "settings",
      user: sessionUser,
      skills,
      projects,
      reviews,
      certificationRequests: [],
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
    });
  } catch (error) {
    return handleControllerError(error, res, "/profile", "Edit profile render failed:");
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const skillInputs = String(req.body.skillsCsv || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    await userService.updateUser(sessionUser._id, {
      name: req.body.name,
      bio: req.body.bio,
      company: req.body.company,
      location: req.body.location,
      githubUrl: req.body.github,
      linkedin: req.body.linkedin,
      website: req.body.website,
    });

    if (skillInputs.length > 0) {
      const existingSkills = new Set((sessionUser.skills || []).map((skill) => String(skill.name || skill)));
      const newSkills = skillInputs.filter((skillName) => !existingSkills.has(skillName));

      if (newSkills.length > 0) {
        await userService.addSkills(sessionUser._id, newSkills);
      }
    }

    return res.redirect("/profile");
  } catch (error) {
    return handleControllerError(error, res, "/profile/edit", "Update profile failed:");
  }
};
