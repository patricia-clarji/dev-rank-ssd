const bcrypt = require("bcrypt");
const User = require("../models/mongo/User");
const Skill = require("../models/mongo/Skill");
const userLogger = require("../loggers/userLogger");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");
const { normalizeUsername, isValidUsername } = require("../utils/stringUtils");

const Project = require("../models/mongo/Project");
const Review = require("../models/mongo/Review");
const CertificationRequest = require("../models/mongo/CertificationRequest");

const ALLOWED_ROLES = ["developer", "reviewer", "admin"];

exports.registerUser = async ({ username, name, email, password, role, bio, githubUrl, avatarUrl, company, location, linkedin, website }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("A user with this email address already exists.", 409, ERROR_CODES.DUPLICATE);
  }
  const normalizedUsername = username ? normalizeUsername(username) : undefined;
  if (normalizedUsername) {
    if (!isValidUsername(normalizedUsername)) {
      throw new AppError(
        "A valid username may only contain letters, numbers, underscores, and hyphens, and must be 3-30 characters long.",
        400,
        ERROR_CODES.VALIDATION
      );
    }

    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      throw new AppError("A user with this username already exists.", 409, ERROR_CODES.DUPLICATE);
    }
  }
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username: normalizedUsername || undefined,
    name,
    email,
    passwordHash,
    role,
    bio,
    githubUrl,
    avatarUrl,
    company,
    location,
    linkedin,
    website,
  });

  userLogger.logUserRegistered(user._id.toString(), user.name, user.role);

  return user;
};

exports.getAllUsers = async () => {
  return await User.find().populate("skills");
};

exports.getUser = async (id) => {
  const user = await User.findById(id).populate("skills");
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  return user;
};

exports.getUserByName = async (name) => {
  const user = await User.findOne({ name }).populate("skills");
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  return user;
};

exports.updateUser = async (id, { name, bio, githubUrl, avatarUrl, company, location, linkedin, website }) => {
  const user = await User.findByIdAndUpdate(
    id,
    { name, bio, githubUrl, avatarUrl, company, location, linkedin, website },
    { returnDocument: "after", runValidators: true }
  ).populate("skills");

  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  userLogger.logUserUpdated(user._id.toString(), user.name);

  return user;
};


async function cleanupUserData(user) {
  // Delete reviews on projects owned by this user, then delete owned projects.
  const ownedProjects = await Project.find({ user: user._id }).select("_id");
  const ownedProjectIds = ownedProjects.map((project) => project._id);

  if (ownedProjectIds.length > 0) {
    await Review.deleteMany({ project: { $in: ownedProjectIds } });
  }

  await Project.deleteMany({ user: user._id });

  // Delete reviews authored by this user.
  await Review.deleteMany({ reviewer: user._id });

  // Remove from skills
  await Skill.updateMany(
    { users: user._id },
    { $pull: { users: user._id } }
  );

  await CertificationRequest.deleteMany({ user: user._id });
  
}

exports.deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  await cleanupUserData(user);
  await User.findByIdAndDelete(id);

  userLogger.logUserDeleted(user._id.toString(), user.name);

  return { message: "User deleted successfully." };
};

const resolveSkillIds = async (inputs) => {
  const isMongoId = (value) => /^[a-f\d]{24}$/i.test(value);
  const arr = Array.isArray(inputs) ? inputs : [inputs];
  const skills = await Skill.find({
    $or: [
      { _id: { $in: arr.filter(isMongoId) } },
      { name: { $in: arr.filter((v) => !isMongoId(v)) } },
    ],
  });
  if (skills.length !== arr.length) {
    throw new AppError("One or more skills were not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  return skills.map((s) => s._id);
};
 
exports.addSkills = async (userId, skillInputs) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const ids = await resolveSkillIds(skillInputs);
  const existingIds = new Set(user.skills.map(String));
  const newIds = ids.filter((id) => !existingIds.has(id.toString()));
  if (newIds.length === 0) {
    throw new AppError("All provided skills are already assigned to this user.", 409, ERROR_CODES.DUPLICATE);
  }

  user.skills.push(...newIds);
  await user.save();
  await Skill.updateMany({ _id: { $in: newIds } }, { $addToSet: { users: user._id } });
  await user.populate("skills");

  userLogger.logUserSkillsAdded(user._id.toString(), Array.isArray(skillInputs) ? skillInputs : [skillInputs], newIds.length);

  return { user, count: newIds.length };
};

exports.removeSkill = async (userId, skillId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const ids = await resolveSkillIds(skillId);
  const skillIdString = ids[0].toString();
  const existingSkillStrings = user.skills.map(String);
  const removableIds = ids.filter((id) => existingSkillStrings.includes(id.toString()));

  if (removableIds.length === 0) {
    throw new AppError("This skill is not assigned to the user.", 404, ERROR_CODES.NOT_FOUND);
  }

  user.skills = user.skills.filter((s) => s.toString() !== skillIdString);
  await user.save();

  await Skill.updateMany(
    { _id: { $in: removableIds } },
    { $pull: { users: user._id } }
  );

  await user.populate("skills");

  userLogger.logUserSkillRemoved(user._id.toString(), skillId, removableIds.length);

  return { user, count: removableIds.length };
};

exports.removeSkills = async (userId, skills) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const ids = await resolveSkillIds(skills);

  const existingSkillStr = user.skills.map(String);
  const removableIds = ids.filter((id) => existingSkillStr.includes(id.toString()));

  if (removableIds.length === 0) {
    throw new AppError("None of the provided skills are assigned to this user.", 404, ERROR_CODES.NOT_FOUND);
  }

  const removableStr = removableIds.map(String);

  user.skills = user.skills.filter((s) => !removableStr.includes(s.toString()));
  await user.save();

  await Skill.updateMany(
    { _id: { $in: removableIds } },
    { $pull: { users: user._id } }
  );

  await user.populate("skills");

  userLogger.logUserSkillsRemoved(user._id.toString(), skills, removableIds.length);

  return { user, count: removableIds.length };
};


exports.getUserSkills = async (userId) => {
  const user = await User.findById(userId).populate('skills', 'name category');
  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
  }
  return user.skills;
}

exports.updateUserRole = async ({ actorId, targetUserId, newRole }) => {
  const normalizedRole = String(newRole || "").trim().toLowerCase();

  if (!actorId || !targetUserId) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    throw new AppError("Invalid role selected.", 400, ERROR_CODES.VALIDATION);
  }

  if (String(actorId) === String(targetUserId)) {
    throw new AppError("You cannot change your own role.", 403, ERROR_CODES.FORBIDDEN);
  }

  const actor = await User.findById(actorId);
  if (!actor) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  if (targetUser.isSuperAdmin) {
    throw new AppError("The super admin role cannot be changed here.", 403, ERROR_CODES.FORBIDDEN);
  }

  if (targetUser.role === normalizedRole) {
    throw new AppError("This user already has that role.", 409, ERROR_CODES.DUPLICATE);
  }

  targetUser.role = normalizedRole;
  targetUser.isVerifiedReviewer = normalizedRole !== "developer";
  targetUser.reviewerStatus = normalizedRole === "developer" ? "none" : "approved";

  await targetUser.save();

  userLogger.logUserRoleChanged(actor._id.toString(), targetUser._id.toString(), actor.role, normalizedRole);

  return targetUser;
};
