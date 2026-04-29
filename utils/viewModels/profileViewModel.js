const mapperService = require("../../services/mapperService");
const { USER_CERTIFICATION_STATUSES } = require("../../constants/statusConstants");

function mapUserProfileView(userDoc, projects = [], reviews = [], certificationRequests = [], isReviewer = false) {
  const user = mapperService.mapUser(userDoc) || {};

  const currentUserName = user.name || "User";
  const firstName = String(currentUserName).split(" ")[0];

  const normalizedSkills = (user.skills || []).map((skill, idx) => {
    if (typeof skill === "string") {
      return { id: "skill-" + idx, name: skill, category: "General" };
    }
    return {
      id: skill._id || ("skill-" + idx),
      name: skill.name || "",
      category: skill.category || "General",
    };
  });

  const publicProfileUrl = "/user/" + (user.username || "developer");

  const ownCertification = (certificationRequests || []).find((request) => {
    const requestUserId = (request.user && request.user._id) ? String(request.user._id) : "";
    return requestUserId && user._id && requestUserId === String(user._id);
  });

  const userCertificationStatus = null;

  const certStatus = isReviewer
    ? USER_CERTIFICATION_STATUSES.CERTIFIED
    : (userCertificationStatus || (ownCertification ? ownCertification.status : USER_CERTIFICATION_STATUSES.NOT_APPLIED));

  const reviewsList = reviews || [];
  const hireVotes = reviewsList.filter((reviewItem) => reviewItem.wouldHire).length;
  const hireRate = reviewsList.length > 0 ? Math.round((hireVotes / reviewsList.length) * 100) : 0;

  const avgProjectRating = (projects || []).length > 0
    ? (projects || []).reduce((sum, projectItem) => sum + Number(projectItem.averageRating || 0), 0) / (projects || []).length
    : 0;

  const certificationRequirements = [
    { text: "At least 5 published projects", met: (projects || []).length >= 5 },
    { text: "Average rating of 4.0 or higher", met: avgProjectRating >= 4 },
    { text: "Minimum 10 skills on profile", met: normalizedSkills.length >= 10 },
    { text: "GitHub account connected", met: Boolean(user.github) },
    { text: "Profile complete (bio, avatar, etc.)", met: Boolean(user.bio) }
  ];

  const allRequirementsMet = certificationRequirements.every((requirement) => requirement.met);

  return {
    currentUser: user,
    currentUserName,
    firstName,
    normalizedSkills,
    publicProfileUrl,
    ownCertification,
    certStatus,
    reviewsList,
    hireRate,
    avgProjectRating,
    certificationRequirements,
    allRequirementsMet,
  };
}

module.exports = {
  mapUserProfileView,
};
