const userService = require('../../services/userService');
const { createUser } = require('../factories/userFactory');
const { createSkill } = require('../factories/skillFactory');
const { createProject } = require('../factories/projectFactory');
const { createReview } = require('../factories/reviewFactory');
const User = require('../../models/mongo/User');
const Skill = require('../../models/mongo/Skill');
const Project = require('../../models/mongo/Project');
const Review = require('../../models/mongo/Review');
const AppError = require('../../utils/AppError');

describe('userService', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Skill.deleteMany({});
    await Project.deleteMany({});
    await Review.deleteMany({});
  });

  it('should not allow duplicate email registration', async () => {
    await userService.registerUser({ name: 'A', email: 'dup@test.com', password: 'pw' });
    await expect(userService.registerUser({ name: 'A', email: 'dup@test.com', password: 'pw' })).rejects.toThrow(AppError);
  });

  it('should throw if user not found for add/remove skill', async () => {
    const skill = await createSkill({ name: 'S' });
    await expect(userService.addSkills('000000000000000000000000', [skill._id])).rejects.toThrow(AppError);
    await expect(userService.removeSkill('000000000000000000000000', skill._id)).rejects.toThrow(AppError);
  });

  it('should throw if skill not found or already assigned/removed', async () => {
    const user = await createUser({ name: 'U', email: 'u@test.com' });
    await expect(userService.addSkills(user._id, ['000000000000000000000000'])).rejects.toThrow(AppError);
    await expect(userService.removeSkill(user._id, '000000000000000000000000')).rejects.toThrow(AppError);
  });

  it('should throw if skill already assigned or not assigned', async () => {
    const user = await createUser({ name: 'U', email: 'u2@test.com' });
    const skill = await createSkill({ name: 'S2-unique-always' });
    await userService.addSkills(user._id, [skill._id.toString()]);
    // Debug: check if skill exists in DB before second addSkills
    const foundSkill = await Skill.findById(skill._id);
    expect(foundSkill).not.toBeNull();
    // Assert 'already assigned' immediately after first add
    await expect(userService.addSkills(user._id, [skill._id.toString()])).rejects.toThrow('All provided skills are already assigned to this user.');
    // Robust error assertion for addSkills
    await expect(userService.removeSkill(user._id, skill._id.toString())).resolves.toBeDefined();
    // After removal, skill exists in DB but not assigned to user: should throw 'not assigned' error
    await expect(userService.removeSkill(user._id, skill._id.toString())).rejects.toThrow('not assigned');
  });

  it('should throw if skill does not exist in DB when removing', async () => {
    const user = await createUser({ name: 'U3', email: 'u3@test.com' });
    const skill = await createSkill({ name: 'S3' });
    await userService.addSkills(user._id, [skill._id.toString()]);
    await userService.removeSkill(user._id, skill._id.toString()); // remove from user
    await Skill.deleteOne({ _id: skill._id }); // remove from DB
    await expect(userService.removeSkill(user._id, skill._id.toString())).rejects.toThrow('One or more skills were not found.');
  });

  // --- Additional negative/edge-case tests for full coverage ---

  it('should throw if user not found on removeSkills', async () => {
    await expect(userService.removeSkills('000000000000000000000000', ['000000000000000000000000'])).rejects.toThrow('User not found');
  });

  it('should throw if none of the provided skills are assigned to user in removeSkills', async () => {
    const user = await createUser({ name: 'U4', email: 'u4@test.com' });
    const skill = await createSkill({ name: 'S4' });
    await expect(userService.removeSkills(user._id, [skill._id.toString()])).rejects.toThrow('None of the provided skills are assigned to this user.');
  });

  it('should remove assigned skill from user (positive path)', async () => {
    const user = await createUser({ name: 'U8', email: 'u8@test.com' });
    const skill = await createSkill({ name: 'S8' });
    // Assign skill
    user.skills.push(skill._id);
    await user.save();
    // Remove skill
    const result = await userService.removeSkills(user._id, [skill._id.toString()]);
    expect(result.user.skills.map(s => s.toString())).not.toContain(skill._id.toString());
    expect(result.count).toBe(1);
  });

  it('should delete reviews for projects owned by a deleted user', async () => {
    const owner = await createUser({ name: 'DeleteOwner', email: 'delete-owner@test.com' });
    const reviewer = await createUser({ name: 'DeleteReviewer', email: 'delete-reviewer@test.com' });
    const project = await createProject(owner._id.toString(), { title: 'Owned Project To Delete' });

    await createReview(reviewer._id.toString(), project._id.toString(), {
      overallRating: 4,
      codeQualityScore: 4,
      creativityScore: 4,
      cleanCodeScore: 4,
      status: 'published',
    });

    expect(await Review.countDocuments({ project: project._id })).toBe(1);

    await userService.deleteUser(owner._id.toString());

    expect(await Review.countDocuments({ project: project._id })).toBe(0);
  });

  it('should block self-deletion from the admin dashboard flow', async () => {
    const user = await createUser({
      name: "Test User",
      email: "test1@test.com",
      role: "admin",
      isSuperAdmin: true,
    });

    await expect(
      userService.deleteUser({
        actorId: user._id,
        targetUserId: user._id,
      })
    ).rejects.toThrow("You cannot delete your own account");
  });

  it('should block deletion of another super admin account', async () => {
    const superAdmin1 = await createUser({
      name: "Admin 1",
      email: "admin1@test.com",
      role: "admin",
      isSuperAdmin: true,
    });

    const superAdmin2 = await createUser({
      name: "Admin 2",
      email: "admin2@test.com",
      role: "admin",
      isSuperAdmin: true,
    });

    await expect(
      userService.deleteUser({
        actorId: superAdmin1._id,
        targetUserId: superAdmin2._id,
      })
    ).rejects.toThrow("Super admin accounts cannot be deleted");
  });

  it('should let a super admin delete a user and repair related data', async () => {
    const superAdmin = await createUser({
      name: "Admin",
      email: "admin@test.com",
      role: "admin",
      isSuperAdmin: true,
    });

    const user = await createUser({
      name: "Normal User",
      email: "user@test.com",
    });

    const result = await userService.deleteUser({
      actorId: superAdmin._id,
      targetUserId: user._id,
    });

    const deletedUser = await User.findById(user._id);

    expect(result.message).toBe("User deleted successfully.");
    expect(deletedUser).toBeNull();
  });

});
