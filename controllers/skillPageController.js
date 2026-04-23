const projectService = require("../services/projectService");
const skillService = require("../services/skillService");
const userService = require("../services/userService");
const { getUserFlags, renderApp } = require("./viewModel");

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

    return renderApp(res, "skills", {
      pageTitle: "Skills",
      activeNav: "skills",
      user: sessionUser,
      skills: skillsByCategory,
      groupedSkills,
      allSkillCategories,
      selectedSkillCategory: selectedCategory ? canonicalizeCategory(selectedCategory)[0] : "All",
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
    const skillUsers = Array.isArray(skill.users) ? skill.users : [];
    const topDevelopers = skillUsers.slice(0, 5);
    const userFlags = getUserFlags(sessionUser);

    return renderApp(res, "skill-detail", {
      pageTitle: skill.name,
      activeNav: "skills",
      user: sessionUser,
      skill,
      projects,
      skillUsers,
      topDevelopers,
      totalDevelopers: skillUsers.length,
      totalProjects: projects.length,
      isReviewer: userFlags.isReviewer,
      isAdmin: userFlags.isAdmin,
    });
  } catch (error) {
    return res.redirect("/skills");
  }
};
