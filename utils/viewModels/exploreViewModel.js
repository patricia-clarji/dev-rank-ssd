/**
 * Explore View-Model
 * Computes UI state for explore page
 */

exports.mapExploreProjects = (projects) => {
  if (!projects || !Array.isArray(projects)) {
    return [];
  }

  return projects.map((project) => ({
    _id: project._id,
    title: project.title,
    description: project.description,
    techStack: project.techStack || [],
    owner: project.owner || {},
    ownerUsername: (project.owner && project.owner.username) || "developer",
    averageRating: project.averageRating || 0,
    status: project.status,
    isSeekingReview: project.status === "seeking-review",
  }));
};

exports.mapExploreDevelopers = (developers) => {
  if (!developers || !Array.isArray(developers)) {
    return [];
  }

  return developers.map((developer) => ({
    _id: developer._id,
    username: developer.username || "developer",
    name: developer.name || "Developer",
    bio: developer.bio || "Developer profile",
    profileScore: developer.profileScore || 0,
    skills: developer.skills || [],
  }));
};

exports.mapExploreFilters = (includeDevs, statusFilter, roleFilter) => {
  if (includeDevs) {
    return {
      type: "role",
      options: [
        { value: "all", label: "All Users", selected: (roleFilter || "all") === "all" },
        { value: "developer", label: "Developers", selected: roleFilter === "developer" },
        { value: "reviewer", label: "Reviewers", selected: roleFilter === "reviewer" },
      ],
    };
  } else {
    return {
      type: "status",
      options: [
        { value: "all", label: "All Status", selected: (statusFilter || "all") === "all" },
        { value: "reviewed", label: "Reviewed", selected: statusFilter === "reviewed" },
        { value: "seeking-review", label: "Seeking Review", selected: statusFilter === "seeking-review" },
        { value: "draft", label: "Draft", selected: statusFilter === "draft" },
      ],
    };
  }
};
