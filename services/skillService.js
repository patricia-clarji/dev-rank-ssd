const mongoose = require("mongoose");
const Skill = require("../models/mongo/Skill");
const User = require("../models/mongo/User");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");

exports.createSkill = async ({ name, category, isPreset }) => {
  const existing = await Skill.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
  if (existing) {
    throw new AppError("A skill with this name already exists.", 409, ERROR_CODES.DUPLICATE);
  }
  return await Skill.create({ name, category, isPreset: isPreset || false });
};

exports.getAllSkills = async ({ category, preset }) => {
  const filter = {};
  if (category) filter.category = { $in: Array.isArray(category) ? category : [category] };
  if (preset !== undefined) filter.isPreset = preset === "true";

  const skills = await Skill.find(filter).sort({ isPreset: -1, name: 1 });

  const counts = await User.aggregate([
    { $unwind: "$skills" },
    { $group: { _id: "$skills", userCount: { $sum: 1 } } },
  ]);

  const countMap = Object.fromEntries(
    counts.map((item) => [item._id.toString(), item.userCount])
  );

  return skills.map((skill) => ({
    ...skill.toObject(),
    userCount: countMap[skill._id.toString()] || 0,
  }));
};

exports.getSkill = async (skillIdOrName) => {
  let skill = null;
  if (mongoose.Types.ObjectId.isValid(skillIdOrName)) {
    skill = await Skill.findById(skillIdOrName).populate("users", "name username avatarUrl profileScore");
  }

  if (!skill) {
    skill = await Skill.findOne({
      name: { $regex: `^${String(skillIdOrName || "").trim()}$`, $options: "i" }
    }).populate("users", "name username avatarUrl profileScore");
  }

  if (!skill) {
    throw new AppError("Skill not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  return skill;
};

exports.getSkillByName = async (name) => {
  const skill = await Skill.findOne({
    name: { $regex: `^${name}$`, $options: "i" }
  }).populate("users", "name username avatarUrl profileScore");

  if (!skill) {
    throw new AppError("Skill not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  return skill;
};

exports.updateSkill = async (skillId, { name, category, isPreset }) => {
  if (name) {
    const existing = await Skill.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: skillId },
    });

    if (existing) {
      throw new AppError("A skill with this name already exists.", 409, ERROR_CODES.DUPLICATE);
    }
  }

  const skill = await Skill.findByIdAndUpdate(
    skillId,
    { name, category, isPreset },
    { returnDocument: "after", runValidators: true }
  );

  if (!skill) {
    throw new AppError("Skill not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  return skill;
};


async function cleanupSkillData(skillId) {
  await User.updateMany(
    { skills: skillId },
    { $pull: { skills: skillId } }
  );
}

exports.deleteSkill = async (skillId) => {
  const skill = await Skill.findByIdAndDelete(skillId);
  if (!skill) {
    throw new AppError("Skill not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  await cleanupSkillData(skill._id);
};


exports.updateSkillByName = async (name, { name: newName, category, isPreset }) => {
  if (newName) {
    const existing = await Skill.findOne({
      name: { $regex: `^${newName}$`, $options: "i", $ne: name }
    });
    if (existing) {
      throw new AppError("A skill with this name already exists.", 409, ERROR_CODES.DUPLICATE);
    }
  }
  const skill = await Skill.findOneAndUpdate(
    { name: { $regex: `^${name}$`, $options: "i" } },
    { name: newName, category, isPreset },
    { returnDocument: "after", runValidators: true }
  );

  if (!skill) {
    throw new AppError("Skill not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  return skill;
};

exports.deleteSkillByName = async (name) => {
  const skill = await Skill.findOneAndDelete({
    name: { $regex: `^${name}$`, $options: "i" }
  });

  if (!skill) {
    throw new AppError("Skill not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  await cleanupSkillData(skill._id);
};

exports.getUsersWithSkill = async (skillId) => {
  const skill = await Skill.findById(skillId).populate("users", "name email avatarUrl");
  if (!skill) {
    throw new AppError("Skill not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  return skill.users;
}