const mapperService = require("../../services/mapperService");

function toPlain(doc) {
  if (!doc) return null;
  if (typeof doc.toObject === "function") return doc.toObject();
  return doc;
}

function mapCertificationRequestCard(certDoc, projects = [], sessionUser = null, isAdmin = false) {
  const cert = toPlain(certDoc) || {};

  // Use mapper to normalize nested user/project info when available
  const normalized = mapperService.mapCertification(cert);

  const applicantUser = normalized.user || {};

  const applicantProjectsCount = (projects || []).filter((projectItem) => {
    const projectOwner = projectItem.owner || projectItem.user || {};
    const projectOwnerId = projectOwner._id || projectOwner;
    const applicantUserId = applicantUser._id || "";
    return projectOwnerId && applicantUserId && String(projectOwnerId) === String(applicantUserId);
  }).length;

  const applicantAvgRating = Number(applicantUser.profileScore || 0);
  const applicantSkillsCount = (applicantUser.skills || []).length || 0;

  return {
    ...normalized,
    applicantUser,
    applicantProjectsCount,
    applicantAvgRating: Number(applicantAvgRating.toFixed ? applicantAvgRating.toFixed(1) : applicantAvgRating),
    applicantSkillsCount,
    yearsExperience: cert.experience || "N/A",
    canModerate: isAdmin === true,
  };
}

/**
 * Certifications View-Model
 * Computes UI state for certifications page
 */
function mapCertificationBenefits() {
  return [
    {
      icon: "message-square",
      title: "Review Projects",
      description: "Provide official reviews that impact developer scores",
    },
    {
      icon: "award",
      title: "Certified Badge",
      description: "Display a verified badge on your profile",
    },
    {
      icon: "trending-up",
      title: "Build Reputation",
      description: "Establish yourself as a trusted code reviewer",
    },
    {
      icon: "users",
      title: "Help Community",
      description: "Guide junior developers with your expertise",
    },
  ];
}

function mapCertificationStatus(certStatus) {
  if (certStatus === "certified" || certStatus === "approved") {
    return {
      statusText:
        "Congratulations! You are a certified reviewer and can review projects on DevRank.",
      badgeClass: "status-badge-large certified",
      badgeIcon: "check-circle",
      badgeLabel: "Certified Reviewer",
    };
  } else if (certStatus === "pending") {
    return {
      statusText: "Your certification request is pending review. We will notify you once it has been processed.",
      badgeClass: "status-badge-large pending",
      badgeIcon: "clock",
      badgeLabel: "Pending Review",
    };
  } else if (certStatus === "rejected") {
    return {
      statusText: "Your latest request was rejected. You can improve your profile and apply again.",
      badgeClass: "status-badge-large rejected",
      badgeIcon: "x-circle",
      badgeLabel: "Rejected",
    };
  } else {
    return {
      statusText: "You haven't applied for reviewer certification yet.",
      badgeClass: "status-badge-large not-applied",
      badgeIcon: "user-plus",
      badgeLabel: "Not Applied",
    };
  }
}

module.exports = {
  mapCertificationRequestCard,
  mapCertificationBenefits,
  mapCertificationStatus,
};
