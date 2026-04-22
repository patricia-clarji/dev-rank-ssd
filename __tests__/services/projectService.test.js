const projectService = require('../../services/projectService');
const Project = require('../../models/mongo/Project');
const User = require('../../models/mongo/User');
const Review = require('../../models/mongo/Review');
const AppError = require('../../utils/AppError');
const { createUser } = require('../factories/userFactory');
const { createReview } = require('../factories/reviewFactory');
const { clearMongoCollection } = require('../helpers/db');


describe('projectService', () => {

    it('should throw if getAllProjects is called with non-existent userId', async () => {
      await expect(projectService.getAllProjects({ userId: '000000000000000000000000' })).rejects.toThrow('User not found');
    });

    it('should call recalculateUserProfileScore when deleting a project with a valid user', async () => {
      const project = await projectService.createProject({ userId: user._id.toString(), title: 'T2', description: '', repoUrl: '', techStack: [], status: 'seeking-review' });
      // Add a review to ensure project is scored
      await createReview(user._id.toString(), project._id.toString(), { status: 'published', overallRating: 5 });
      // Delete project and check profileScore is recalculated
      await projectService.deleteProject(project._id.toString());
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.profileScore).toBe(0);
    });
  let user;
  beforeEach(async () => {
    await clearMongoCollection(Project);
    await clearMongoCollection(User);
    await clearMongoCollection(Review);
    user = await createUser({ name: 'ProjUser', email: 'proj@test.com' });
  });

  it('should set profileScore to 0 if user has no projects', async () => {
    await projectService.recalculateUserProfileScore(user._id);
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.profileScore).toBe(0);
  });

  it('should set profileScore to 0 if user has projects but none scored', async () => {
    await Project.create({ user: user._id, title: 'NoScore', description: '', repoUrl: '', techStack: [], status: 'seeking-review' });
    await projectService.recalculateUserProfileScore(user._id);
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.profileScore).toBe(0);
  });

  it('should filter projects by techStack and status', async () => {
    await Project.create({ user: user._id, title: 'P1', description: '', repoUrl: '', techStack: ['Node.js'], status: 'seeking-review' });
    await Project.create({ user: user._id, title: 'P2', description: '', repoUrl: '', techStack: ['React'], status: 'reviewed' });
    const byTech = await projectService.getAllProjects({ techStack: 'Node.js' });
    expect(byTech.length).toBeGreaterThan(0);
    const byStatus = await projectService.getAllProjects({ status: 'reviewed' });
    expect(byStatus.length).toBeGreaterThan(0);
  });

  it('should throw if deleting a project that does not exist', async () => {
    await expect(projectService.deleteProject('000000000000000000000000')).rejects.toThrow('Project not found');
  });

  it('should throw if user not found on create', async () => {
    await expect(projectService.createProject({ userId: '000000000000000000000000', title: 'T', description: '', repoUrl: '', techStack: [] })).rejects.toThrow(AppError);
  });

  it('should throw if project not found on get/update/delete', async () => {
    await expect(projectService.getProject('000000000000000000000000')).rejects.toThrow(AppError);
    await expect(projectService.updateProject('000000000000000000000000', {})).rejects.toThrow(AppError);
    await expect(projectService.deleteProject('000000000000000000000000')).rejects.toThrow(AppError);
  });

  it('should cleanup reviews and recalc profile score on delete', async () => {
    const project = await projectService.createProject({ userId: user._id.toString(), title: 'T', description: '', repoUrl: '', techStack: [], status: 'seeking-review' });
    await createReview(user._id.toString(), project._id.toString(), { status: 'published' });
    await projectService.deleteProject(project._id.toString());
    const reviews = await Review.find({ project: project._id });
    expect(reviews.length).toBe(0);
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.profileScore).toBe(0);
  });

  it('should throw if project not found on getProjectByTitle', async () => {
    await expect(projectService.getProjectByTitle('Nonexistent')).rejects.toThrow('Project not found');
  });

  it('should throw if user not found on getProjectsByUser', async () => {
    await expect(projectService.getProjectsByUser('000000000000000000000000')).rejects.toThrow('User not found');
  });
   
  it('should set profileScore to 0 if user has no projects', async () => {
    await projectService.recalculateUserProfileScore(user._id);
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.profileScore).toBe(0);
  });

  it('should set profileScore to 0 if user has projects but none scored', async () => {
    await Project.create({ user: user._id, title: 'NoScore', description: '', repoUrl: '', techStack: [], status: 'seeking-review' });
    await projectService.recalculateUserProfileScore(user._id);
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.profileScore).toBe(0);
  });

  it('should filter projects by techStack and status', async () => {
    await Project.create({ user: user._id, title: 'P1', description: '', repoUrl: '', techStack: ['Node.js'], status: 'seeking-review' });
    await Project.create({ user: user._id, title: 'P2', description: '', repoUrl: '', techStack: ['React'], status: 'archived' });
    const byTech = await projectService.getAllProjects({ techStack: 'Node.js' });
    expect(byTech.length).toBeGreaterThan(0);
    const byStatus = await projectService.getAllProjects({ status: 'archived' });
    expect(byStatus.length).toBeGreaterThan(0);
  });

  it('should throw if deleting a project that does not exist', async () => {
    await expect(projectService.deleteProject('000000000000000000000000')).rejects.toThrow('Project not found');
  });
});
