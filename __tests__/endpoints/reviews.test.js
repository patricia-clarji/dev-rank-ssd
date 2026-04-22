/**
 * Review Endpoint Tests
 * Tests for /api/reviews endpoints
 */

const request = require("supertest");
const mongoose = require("mongoose");
const Project = require("../../models/mongo/Project");
const Review = require("../../models/mongo/Review");
const User = require("../../models/mongo/User");
const reviewRoutes = require("../../routes/reviewRoutes");
const { createTestApp } = require("../helpers/testSetup");
const { clearMongoCollections } = require("../helpers/db");
const { HTTP_STATUS, API_ROUTES } = require("../helpers/testConstants");
const { createUser } = require("../factories/userFactory");
const { createProject } = require("../factories/projectFactory");
const { createReview } = require("../factories/reviewFactory");

const app = createTestApp(API_ROUTES.REVIEWS, reviewRoutes);

describe("Review API Endpoints", () => {
  let userId;
  let reviewerId;
  let projectId;
  let reviewId;

  beforeEach(async () => {
    await clearMongoCollections(Review, Project, User);

    // Create test users
    const user = await createUser({ name: "Project Owner", email: "owner@test.com" });
    userId = user._id;

    const reviewer = await createUser({
      name: "Reviewer",
      email: "reviewer@test.com",
      role: "reviewer",
      isVerifiedReviewer: true
    });
    reviewerId = reviewer._id;

    // Create test project
    const project = await createProject({
      user: userId,
      title: "Test Project for Review",
      description: "A comprehensive test project description for review",
    });
    projectId = project._id;
  });

  describe("POST /api/reviews", () => {
    it("should create a new review", async () => {
      const reviewData = {
        projectId: projectId,
        reviewerId: reviewerId,
        overallRating: 5,
        codeQualityScore: 5,
        creativityScore: 4,
        cleanCodeScore: 5,
        wouldHire: true,
        generalFeedback: "Excellent project with great code quality!",
        suggestions: ["Consider adding more error handling"],
        status: "published",
      };

      const response = await request(app)
        .post(API_ROUTES.REVIEWS)
        .send(reviewData);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(response.body.review).toBeDefined();
      expect(response.body.review.overallRating).toBe(5);
      reviewId = response.body.review._id;
    });

    it("should fail when missing required fields", async () => {
      const response = await request(app)
        .post(API_ROUTES.REVIEWS)
        .send({ overallRating: 5 });

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("GET /api/reviews", () => {
    it("should get all reviews", async () => {
      await createReview({
        reviewer: reviewerId,
        project: projectId,
        overallRating: 5,
        generalFeedback: "Great project!",
      });

      const response = await request(app).get(API_ROUTES.REVIEWS);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.reviews)).toBe(true);
      expect(response.body.reviews.length).toBeGreaterThan(0);
    });

    it("should filter reviews by status", async () => {
      await createReview({
        reviewer: reviewerId,
        project: projectId,
        overallRating: 5,
        status: "published",
        generalFeedback: "Great project!",
      });

      const response = await request(app)
        .get(API_ROUTES.REVIEWS)
        .query({ status: "published" });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.reviews)).toBe(true);
    });
  });

  describe("GET /api/reviews/:reviewId", () => {
    it("should get review by ID", async () => {
      const review = await createReview({
        reviewer: reviewerId,
        project: projectId,
        overallRating: 5,
        generalFeedback: "Great project!",
      });

      const response = await request(app).get(`${API_ROUTES.REVIEWS}/${review._id}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.review._id.toString()).toBe(review._id.toString());
    });

    it("should return 404 for non-existent review", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`${API_ROUTES.REVIEWS}/${fakeId}`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });


  
  describe("PUT /api/reviews/:reviewId", () => {
    it("should update review successfully", async () => {
      const review = await createReview({
        reviewer: reviewerId,
        project: projectId,
        overallRating: 5,
        generalFeedback: "Great project!",
      });

      const response = await request(app)
        .put(`${API_ROUTES.REVIEWS}/${review._id}`)
        .send({ generalFeedback: "Updated feedback", status: "published" });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.review.generalFeedback).toBe("Updated feedback");
    });

    it("should return 404 for non-existent review", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`${API_ROUTES.REVIEWS}/${fakeId}`)
        .send({ generalFeedback: "Updated feedback" });

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("DELETE /api/reviews/:reviewId", () => {
    it("should delete review successfully", async () => {
      const review = await createReview({
        reviewer: reviewerId,
        project: projectId,
        overallRating: 5,
        generalFeedback: "Great project!",
      });

      const response = await request(app).delete(`${API_ROUTES.REVIEWS}/${review._id}`);

      expect(response.status).toBe(HTTP_STATUS.OK);

      const checkRes = await request(app).get(`${API_ROUTES.REVIEWS}/${review._id}`);
      expect(checkRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it("should remove deleted review from all projects' reviews arrays if referenced", async () => {
      // Create review and project
      const review = await createReview({ reviewer: reviewerId, project: projectId });
      const project = await Project.findById(projectId);
      // Simulate review assignment
      project.reviews = [review._id];
      await project.save();
      // Delete review
      await request(app).delete(`${API_ROUTES.REVIEWS}/${review._id}`);
      // Check project no longer has the review
      const updatedProject = await Project.findById(projectId);
      expect(updatedProject.reviews ? updatedProject.reviews.map(String) : []).not.toContain(review._id.toString());
    });

    it("should return 404 for non-existent review", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`${API_ROUTES.REVIEWS}/${fakeId}`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });
});
