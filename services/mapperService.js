// Data projection/mapping service
// Transforms Mongoose documents into view-ready objects

function toPlain(doc) {
  if (!doc) return null;
  if (typeof doc.toObject === "function") {
    return doc.toObject();
  }
  return doc;
}

function getUsername(user) {
  if (!user) return "user";
  if (user.username) return String(user.username).toLowerCase();
  if (user.email) return String(user.email).split("@")[0].toLowerCase();
  const id = String(user._id || "user");
  return `user-${id.slice(-6)}`;
}

function mapUser(userDoc) {
  const user = toPlain(userDoc);
  if (!user) return null;

  return {
    ...user,
    username: getUsername(user),
    github: user.github || user.githubUrl || null,
    linkedin: user.linkedin || user.linkedinUrl || null,
    website: user.website || user.websiteUrl || null,
    company: user.company || null,
    location: user.location || null,
    createdAt: user.joinedAt || user.createdAt || null,
    skills: (user.skills || []).map((skill) => {
      if (typeof skill === "string") {
        return { _id: skill, name: skill, category: "general" };
      }
      const plainSkill = toPlain(skill) || {};
      return {
        ...plainSkill,
        name: plainSkill.name || "Skill",
        category: Array.isArray(plainSkill.category)
          ? plainSkill.category[0]
          : (plainSkill.category || "general"),
      };
    }),
  };
}

function mapProject(projectDoc) {
  const project = toPlain(projectDoc);
  if (!project) return null;

  const owner = mapUser(project.user || project.owner);

  return {
    ...project,
    owner,
    averageRating: Number(project.aggregateRating ?? project.averageRating ?? 0),
    reviewCount: Number(project.totalReviews ?? project.reviewCount ?? 0),
    codeQualityAvg: Number(project.aggregateCodeQuality ?? project.codeQualityAvg ?? 0),
    creativityAvg: Number(project.aggregateCreativity ?? project.creativityAvg ?? 0),
    cleanCodeAvg: Number(project.aggregateCleanCode ?? project.cleanCodeAvg ?? 0),
  };
}

function mapReview(reviewDoc) {
  const review = toPlain(reviewDoc);
  if (!review) return null;

  const project = review.project ? mapProject(review.project) : null;
  const reviewer = review.reviewer ? mapUser(review.reviewer) : null;

  return {
    ...review,
    project,
    reviewer,
    projectId: review.projectId || (project && project._id ? String(project._id) : ""),
    projectTitle: review.projectTitle || (project ? project.title : "Project"),
    feedback: review.generalFeedback || review.feedback || "",
    codeQuality: Number(review.codeQualityScore ?? review.codeQuality ?? 0),
    creativity: Number(review.creativityScore ?? review.creativity ?? 0),
    cleanCode: Number(review.cleanCodeScore ?? review.cleanCode ?? 0),
    createdAt: review.createdAt || new Date(),
  };
}

function mapCertification(certDoc) {
  const cert = toPlain(certDoc);
  if (!cert) return null;

  const user = cert.user ? mapUser(cert.user) : null;

  return {
    ...cert,
    user,
    name: user ? user.name : "Unknown",
    username: user ? user.username : "user",
    certificate: Array.isArray(cert.techExpertise) ? cert.techExpertise.join(", ") : "",
    submittedAt: cert.submittedAt ? new Date(cert.submittedAt).toLocaleDateString() : "",
  };
}

function mapActivityLog(logDoc) {
  const log = toPlain(logDoc);
  if (!log) return null;

  const timestamp = log.timestamp || log.createdAt || new Date();
  const metadata = log.metadata || {};

  return {
    ...log,
    createdAt: new Date(timestamp).toLocaleString(),
    actor: metadata.actor || metadata.username || log.userId || "system",
    target: metadata.target || log.entityId || log.entity || "",
  };
}

module.exports = {
  mapUser,
  mapProject,
  mapReview,
  mapCertification,
  mapActivityLog,
};
