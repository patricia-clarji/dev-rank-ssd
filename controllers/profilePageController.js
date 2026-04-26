const Review = require("../models/mongo/Review");
const projectService = require("../services/projectService");
const skillService = require("../services/skillService");
const userService = require("../services/userService");
const { getUserFlags, renderApp } = require("../utils/viewRenderer");

exports.profile = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const projects = await projectService.getProjectsByUser(sessionUser._id);
    const projectIds = projects.map((project) => project._id);

    let reviews = [];
    if (projectIds.length > 0) {
      reviews = await Review.find({ project: { $in: projectIds }, status: "published" })
        .populate("project", "title status")
        .populate("reviewer", "name email role githubUrl username")
        .sort({ createdAt: -1 });
    }

    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "profile", {
      pageTitle: "Your profile",
      activeNav: "profile",
      user: sessionUser,
      projects,
      reviews,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/dashboard");
  }
};

exports.editProfile = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const skills = await skillService.getAllSkills({});
    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "profile-edit", {
      pageTitle: "Edit profile",
      activeNav: "settings",
      user: sessionUser,
      skills,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/profile");
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
    return res.redirect("/profile/edit");
  }
};
