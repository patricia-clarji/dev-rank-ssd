/**
 * Skills View-Model
 * Computes UI state for skills listing and detail pages
 */

exports.formatCategoryTitle = (value) => {
  const text = String(value || "").trim();
  if (!text) return "General";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

exports.mapSkillsGroupedByCategory = (skills) => {
  const groupedSkills = {};
  (skills || []).forEach((skillItem) => {
    const categories = Array.isArray(skillItem.category)
      ? skillItem.category
      : [skillItem.category || "General"];
    const categoryName = categories[0];
    if (!groupedSkills[categoryName]) {
      groupedSkills[categoryName] = [];
    }
    groupedSkills[categoryName].push(skillItem);
  });
  return groupedSkills;
};

exports.mapSkillsList = (skills) => {
  if (!skills || !Array.isArray(skills)) {
    return [];
  }

  return skills.map((skill) => ({
    _id: skill._id,
    name: skill.name,
    category: skill.category,
    developerCount: Array.isArray(skill.users) ? skill.users.length : 0,
  }));
};

exports.mapCategoryPills = (allSkillCategories, selectedSkillCategory, skillSearchQuery) => {
  return (allSkillCategories || []).map((categoryName) => ({
    name: categoryName,
    label: exports.formatCategoryTitle(categoryName),
    isActive: (selectedSkillCategory || "All") === categoryName,
    href:
      (selectedSkillCategory || "All") === categoryName
        ? `/skills?q=${encodeURIComponent(skillSearchQuery || "")}`
        : `/skills?category=${encodeURIComponent(categoryName)}&q=${encodeURIComponent(
            skillSearchQuery || ""
          )}`,
  }));
};

exports.mapSkillsGroupedWithCounts = (skills) => {
  if (!skills || !Array.isArray(skills)) {
    return {};
  }

  const grouped = {};
  skills.forEach((skill) => {
    const categories = Array.isArray(skill.category)
      ? skill.category
      : [skill.category || "General"];
    const categoryName = categories[0];
    if (!grouped[categoryName]) {
      grouped[categoryName] = [];
    }
    grouped[categoryName].push({
      _id: skill._id,
      name: skill.name,
      category: skill.category,
      developerCount: Array.isArray(skill.users) ? skill.users.length : 0,
    });
  });
  return grouped;
};

exports.mapSkillDetailPage = (skill, projects) => {
  const currentSkill = skill || {};
  const recentProjects = (projects || []).slice(0, 3);
  const totalDevelopers = Array.isArray(skill.users) ? skill.users.length : 0;
  const topDevelopers = (Array.isArray(skill.users) ? skill.users : []).slice(0, 5).map((dev) => {
    const devProjectCount = (projects || []).filter((project) => {
      return String(project.user?._id || project.user) === String(dev._id);
    }).length;
    return {
      _id: dev._id,
      name: dev.name,
      username: dev.username,
      profileUrl: `/user/${dev.username || dev._id}`,
      avatarUrl: dev.avatarUrl,
      profileScore: dev.profileScore,
      projects: devProjectCount,
    };
  });

  return {
    currentSkill,
    recentProjects,
    totalDevelopers,
    topDevelopers,
  };
};
