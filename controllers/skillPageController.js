const projectService = require("../services/projectService");
const skillService = require("../services/skillService");
const userService = require("../services/userService");
const { getUserFlags, renderApp } = require("./viewModel");

function normalizeCategory(value) {
  return String(value || "General").trim();
}

function canonicalizeCategory(value) {
  return normalizeCategory(value)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

exports.skills = async (req, res) => {
  try {
    const sessionUser = req.currentUser;
    const query = String(req.query.q || "").trim().toLowerCase();
    const selectedCategory = String(req.query.category || "").trim();
    const selectedCategoryKey = selectedCategory && selectedCategory !== "All"
      ? normalizeCategory(selectedCategory).toLowerCase()
      : "all";

    const allSkills = await skillService.getAllSkills({});
    const allSkillCategories = Array.from(
      new Map(
        allSkills.map((skill) => {
          const canonicalCategory = canonicalizeCategory(skill.category);
          return [canonicalCategory.toLowerCase(), canonicalCategory];
        })
      ).values()
    );

    const skillsByCategory = selectedCategoryKey !== "all"
      ? allSkills.filter((skill) => normalizeCategory(skill.category).toLowerCase() === selectedCategoryKey)
      : allSkills;

    const filteredSkills = query
      ? skillsByCategory.filter((skill) => {
          const name = String(skill.name || "").toLowerCase();
          const category = String(skill.category || "").toLowerCase();
          return name.includes(query) || category.includes(query);
        })
      : skillsByCategory;

    const groupedSkills = filteredSkills.reduce((accumulator, skill) => {
      const categoryName = canonicalizeCategory(skill.category);
      if (!accumulator[categoryName]) {
        accumulator[categoryName] = [];
      }
      accumulator[categoryName].push(skill);
      return accumulator;
    }, {});

    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "skills", {
      pageTitle: "Skills",
      activeNav: "skills",
      user: sessionUser,
      skills: filteredSkills,
      groupedSkills,
      allSkillCategories,
      selectedSkillCategory: selectedCategory ? canonicalizeCategory(selectedCategory) : "All",
      skillSearchQuery: query,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
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
    const exploreUsers = await userService.getAllUsers();
    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "skill-detail", {
      pageTitle: skill.name,
      activeNav: "skills",
      user: sessionUser,
      skill,
      projects,
      exploreUsers,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/skills");
  }
};
