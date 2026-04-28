const projectService = require("../services/projectService");
const skillService = require("../services/skillService");
const userService = require("../services/userService");
const Review = require("../models/mongo/Review");
const { getUserFlags, renderApp } = require("../utils/viewRenderer");
const profileViewModel = require("../utils/viewModels/profileViewModel");
const certificationService = require("../services/certificationService");
const skillsViewModel = require("../utils/viewModels/skillsViewModel");

function normalizeCategory(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (!value && value !== 0) {
    return ["General"];
  }

  return [String(value).trim()];
}

function canonicalizeCategory(value) {
  return normalizeCategory(value).map((category) =>
    String(category || "General")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

exports.skills = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const query = String(req.query.q || "").trim().toLowerCase();
    const selectedCategory = String(req.query.category || "").trim();
    const selectedCategoryKey = selectedCategory && selectedCategory !== "All"
      ? String(selectedCategory).trim().toLowerCase()
      : "all";

    const allSkills = await skillService.getAllSkills({});
    let filteredSkills = allSkills;
    if (query) {
      const regex = new RegExp(query, 'i');
      filteredSkills = allSkills.filter(skill => regex.test(skill.name));
    }
    const allSkillCategories = Array.from(
      new Map(
        allSkills.flatMap((skill) => {
          return canonicalizeCategory(skill.category).map((singleCategory) => [singleCategory.toLowerCase(), singleCategory]);
        })
      ).values()
    );

    const skillsByCategory = selectedCategoryKey !== "all"
      ? filteredSkills.filter(skill => canonicalizeCategory(skill.category).some(cat => cat.toLowerCase() === selectedCategoryKey))
      : filteredSkills;

    const groupedSkills = filteredSkills.reduce((accumulator, skill) => {
      const categoryNames = canonicalizeCategory(skill.category);
      categoryNames.forEach((categoryName) => {
        if (!accumulator[categoryName]) {
          accumulator[categoryName] = [];
        }
        accumulator[categoryName].push(skill);
      });
      return accumulator;
    }, {});

    const userFlags = getUserFlags(sessionUser);
    const userProjects = await projectService.getProjectsByUser(sessionUser._id);
    const userProjectIds = userProjects.map((p) => p._id);
    const userReviews = userProjectIds.length > 0
      ? await Review.find({ project: { $in: userProjectIds }, status: "published" })
          .populate("project", "title")
          .populate("reviewer", "name")
      : [];
    const certifications = await certificationService.getAllRequests();
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, userProjects, userReviews, certifications, userFlags.isReviewer);
    const skillsList = skillsViewModel.mapSkillsList(skillsByCategory);
    const groupedSkillsWithCounts = skillsViewModel.mapSkillsGroupedWithCounts(filteredSkills);
    const groupedSkillsForTemplate = selectedCategoryKey !== "all"
      ? { [selectedCategoryKey]: (groupedSkillsWithCounts[selectedCategoryKey] || []) }
      : groupedSkillsWithCounts;
    const categoryPills = skillsViewModel.mapCategoryPills(allSkillCategories, selectedCategory ? canonicalizeCategory(selectedCategory)[0] : "All", query);

    return renderApp(res, "skills", {
      pageTitle: "Skills",
      activeNav: "skills",
      user: sessionUser,
      skills: skillsList,
      groupedSkills: groupedSkillsForTemplate,
      allSkillCategories,
      categoryPills,
      selectedSkillCategory: selectedCategory ? canonicalizeCategory(selectedCategory)[0] : "All",
      skillSearchQuery: query,
      isShowingAll: selectedCategoryKey === "all",
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      projects: userProjects,
      reviews: userReviews,
      ...profileVM,
      certificationRequests: certifications,
    });
  } catch (error) {
    return res.redirect("/dashboard");
  }
};

exports.skillDetail = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const skill = await skillService.getSkill(req.params.id);
    const projects = await projectService.getAllProjects({ techStack: skill.name });
    const userFlags = getUserFlags(sessionUser);
    const userProjects = await projectService.getProjectsByUser(sessionUser._id);
    const userProjectIds = userProjects.map((p) => p._id);
    const userReviews = userProjectIds.length > 0
      ? await Review.find({ project: { $in: userProjectIds }, status: "published" })
          .populate("project", "title")
          .populate("reviewer", "name")
      : [];
    const certifications = await certificationService.getAllRequests();
    const profileVM = profileViewModel.mapUserProfileView(sessionUser, userProjects, userReviews, certifications, userFlags.isReviewer);
    const skillDetailVM = skillsViewModel.mapSkillDetailPage(skill, projects);

    return renderApp(res, "skill-detail", {
      pageTitle: skill.name,
      activeNav: "skills",
      user: sessionUser,
      skill,
      recentProjects: skillDetailVM.recentProjects,
      skillUsers: skillDetailVM.topDevelopers,
      topDevelopers: skillDetailVM.topDevelopers,
      totalDevelopers: skillDetailVM.totalDevelopers,
      totalProjects: projects.length,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
      ...profileVM,
      certificationRequests: certifications,
      reviews: userReviews,
    });
  } catch (error) {
    return res.redirect("/skills");
  }
};
