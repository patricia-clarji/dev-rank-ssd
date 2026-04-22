const reviewService = require('../../services/reviewService');
const Review = require('../../models/mongo/Review');
const Project = require('../../models/mongo/Project');
const User = require('../../models/mongo/User');
const AppError = require('../../utils/AppError');
const { createUser } = require('../factories/userFactory');
const { createProject } = require('../factories/projectFactory');
const { clearMongoCollection } = require('../helpers/db');


describe('reviewService', () => {
  let user, reviewer, project;
  beforeEach(async () => {
    await clearMongoCollection(Review);
    await clearMongoCollection(Project);
    await clearMongoCollection(User);
    user = await createUser({ name: 'Owner', email: 'owner@test.com' });
    reviewer = await createUser({ name: 'Reviewer', email: 'reviewer@test.com', role: 'reviewer', isVerifiedReviewer: true });
    project = await createProject(user._id.toString());
  });

  it('should throw if project or reviewer not found', async () => {
    await expect(reviewService.createReview({ projectId: '000000000000000000000000', reviewerId: reviewer._id.toString(), overallRating: 5, codeQualityScore: 5, creativityScore: 5, cleanCodeScore: 5, wouldHire: true, generalFeedback: '', suggestions: [], status: 'published' })).rejects.toThrow(AppError);
    await expect(reviewService.createReview({ projectId: project._id.toString(), reviewerId: '000000000000000000000000', overallRating: 5, codeQualityScore: 5, creativityScore: 5, cleanCodeScore: 5, wouldHire: true, generalFeedback: '', suggestions: [], status: 'published' })).rejects.toThrow(AppError);
  });

  it('should create a review successfully', async () => {
    const review = await reviewService.createReview({
      projectId: project._id.toString(),
      reviewerId: reviewer._id.toString(),
      overallRating: 4,
      codeQualityScore: 4,
      creativityScore: 5,
      cleanCodeScore: 5,
      wouldHire: true,
      generalFeedback: 'Great project',
      suggestions: ['Improve docs'],
      status: 'published',
    });
    expect(review).toBeDefined();
    expect(review.project._id.toString()).toBe(project._id.toString());
    expect(review.reviewer._id.toString()).toBe(reviewer._id.toString());
    expect(review.overallRating).toBe(4);
    expect(review.status).toBe('published');
  });

  it('should get all reviews (with and without filters)', async () => {
    // Create two reviews
    const reviewer2 = await createUser({ name: 'Reviewer2', email: 'reviewer2@test.com', role: 'reviewer', isVerifiedReviewer: true });
    await reviewService.createReview({
      projectId: project._id.toString(),
      reviewerId: reviewer._id.toString(),
      overallRating: 4,
      codeQualityScore: 4,
      creativityScore: 5,
      cleanCodeScore: 5,
      wouldHire: true,
      generalFeedback: 'Good',
      suggestions: [],
      status: 'published',
    });
    await reviewService.createReview({
      projectId: project._id.toString(),
      reviewerId: reviewer2._id.toString(),
      overallRating: 3,
      codeQualityScore: 3,
      creativityScore: 4,
      cleanCodeScore: 4,
      wouldHire: false,
      generalFeedback: 'Okay',
      suggestions: [],
      status: 'published',
    });
    // No projectId filter: should return all reviews
    const all = await reviewService.getAllReviews();
    expect(all.length).toBe(2);
    // projectId filter not provided (empty object): should return all reviews
    const allNoProjectFilter = await reviewService.getAllReviews({});
    expect(allNoProjectFilter.length).toBe(2);
    // projectId filter explicitly undefined: should return all reviews
    const allProjectIdUndefined = await reviewService.getAllReviews({ projectId: undefined });
    expect(allProjectIdUndefined.length).toBe(2);
    // With reviewerId filter
    const filtered = await reviewService.getAllReviews({ reviewerId: reviewer._id.toString() });
    expect(filtered.length).toBe(1);
    expect(filtered[0].reviewer._id.toString()).toBe(reviewer._id.toString());
  });

  it('should get a review by id and throw if not found', async () => {
    const created = await reviewService.createReview({
      projectId: project._id.toString(),
      reviewerId: reviewer._id.toString(),
      overallRating: 5,
      codeQualityScore: 5,
      creativityScore: 5,
      cleanCodeScore: 5,
      wouldHire: true,
      generalFeedback: '',
      suggestions: [],
      status: 'published',
    });
    const found = await reviewService.getReview(created._id.toString());
    expect(found).toBeDefined();
    expect(found._id.toString()).toBe(created._id.toString());
    await expect(reviewService.getReview('000000000000000000000000')).rejects.toThrow('Review not found');
  });

  it('should update a review and throw if not found', async () => {
    const created = await reviewService.createReview({
      projectId: project._id.toString(),
      reviewerId: reviewer._id.toString(),
      overallRating: 2,
      codeQualityScore: 2,
      creativityScore: 2,
      cleanCodeScore: 2,
      wouldHire: false,
      generalFeedback: '',
      suggestions: [],
      status: 'published',
    });
    const updated = await reviewService.updateReview(created._id.toString(), {
      overallRating: 5,
      codeQualityScore: 5,
      creativityScore: 5,
      cleanCodeScore: 5,
      wouldHire: true,
      generalFeedback: 'Updated',
      suggestions: ['None'],
      status: 'published',
    });
    expect(updated.overallRating).toBe(5);
    expect(updated.generalFeedback).toBe('Updated');
    await expect(reviewService.updateReview('000000000000000000000000', { overallRating: 1 })).rejects.toThrow('Review not found');
  });

  it('should recalculate owner profileScore after review update', async () => {
    const created = await reviewService.createReview({
      projectId: project._id.toString(),
      reviewerId: reviewer._id.toString(),
      overallRating: 2,
      codeQualityScore: 2,
      creativityScore: 2,
      cleanCodeScore: 2,
      wouldHire: false,
      generalFeedback: 'Initial',
      suggestions: [],
      status: 'published',
    });

    const ownerBeforeUpdate = await User.findById(user._id);
    expect(ownerBeforeUpdate.profileScore).toBe(2);

    await reviewService.updateReview(created._id.toString(), {
      overallRating: 5,
      codeQualityScore: 5,
      creativityScore: 5,
      cleanCodeScore: 5,
      wouldHire: true,
      generalFeedback: 'Updated',
      suggestions: ['None'],
      status: 'published',
    });

    const ownerAfterUpdate = await User.findById(user._id);
    expect(ownerAfterUpdate.profileScore).toBe(5);
  });

  it('should delete a review successfully', async () => {
    const created = await reviewService.createReview({
      projectId: project._id.toString(),
      reviewerId: reviewer._id.toString(),
      overallRating: 3,
      codeQualityScore: 3,
      creativityScore: 3,
      cleanCodeScore: 3,
      wouldHire: false,
      generalFeedback: '',
      suggestions: [],
      status: 'published',
    });
    const result = await reviewService.deleteReview(created._id.toString());
    expect(result).toEqual({ message: 'Review deleted successfully.' });
    await expect(reviewService.getReview(created._id.toString())).rejects.toThrow('Review not found');
  });

  it('should recalculate owner profileScore after review deletion', async () => {
    const created = await reviewService.createReview({
      projectId: project._id.toString(),
      reviewerId: reviewer._id.toString(),
      overallRating: 4,
      codeQualityScore: 4,
      creativityScore: 4,
      cleanCodeScore: 4,
      wouldHire: true,
      generalFeedback: 'To be deleted',
      suggestions: [],
      status: 'published',
    });

    const ownerAfterCreate = await User.findById(user._id);
    expect(ownerAfterCreate.profileScore).toBe(4);

    await reviewService.deleteReview(created._id.toString());

    const ownerAfterDelete = await User.findById(user._id);
    expect(ownerAfterDelete.profileScore).toBe(0);
  });

  it('should throw if reviewer is not verified or not reviewer role', async () => {
    const notVerified = await createUser({ name: 'NV', email: 'nv@test.com', role: 'reviewer', isVerifiedReviewer: false });
    await expect(reviewService.createReview({ projectId: project._id.toString(), reviewerId: notVerified._id.toString(), overallRating: 5, codeQualityScore: 5, creativityScore: 5, cleanCodeScore: 5, wouldHire: true, generalFeedback: '', suggestions: [], status: 'published' })).rejects.toThrow(AppError);
    const notReviewer = await createUser({ name: 'NR', email: 'nr@test.com', role: 'developer', isVerifiedReviewer: true });
    await expect(reviewService.createReview({ projectId: project._id.toString(), reviewerId: notReviewer._id.toString(), overallRating: 5, codeQualityScore: 5, creativityScore: 5, cleanCodeScore: 5, wouldHire: true, generalFeedback: '', suggestions: [], status: 'published' })).rejects.toThrow(AppError);
  });

  it('should throw if reviewer is project owner', async () => {
    await expect(reviewService.createReview({ projectId: project._id.toString(), reviewerId: user._id.toString(), overallRating: 5, codeQualityScore: 5, creativityScore: 5, cleanCodeScore: 5, wouldHire: true, generalFeedback: '', suggestions: [], status: 'published' })).rejects.toThrow(AppError);
  });

  it('should throw if duplicate review', async () => {
    await reviewService.createReview({ projectId: project._id.toString(), reviewerId: reviewer._id.toString(), overallRating: 5, codeQualityScore: 5, creativityScore: 5, cleanCodeScore: 5, wouldHire: true, generalFeedback: '', suggestions: [], status: 'published' });
    await expect(reviewService.createReview({ projectId: project._id.toString(), reviewerId: reviewer._id.toString(), overallRating: 5, codeQualityScore: 5, creativityScore: 5, cleanCodeScore: 5, wouldHire: true, generalFeedback: '', suggestions: [], status: 'published' })).rejects.toThrow(AppError);
  });

  it('should throw if review not found on delete', async () => {
    await expect(reviewService.deleteReview('000000000000000000000000')).rejects.toThrow('Review not found');
  });
});
