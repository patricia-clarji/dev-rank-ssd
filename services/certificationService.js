const CertificationRequest = require("../models/mongo/CertificationRequest");
const User = require("../models/mongo/User");
const certificationLogger = require("../loggers/certificationLogger");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");

exports.apply = async ({ userId, cvUrl, experience, motivation, techExpertise }) => {
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const existing = await CertificationRequest.findOne({ user: userId, status: "pending" });
  if (existing) {
    throw new AppError("User already has a pending certification request.", 409, ERROR_CODES.DUPLICATE);
  }

  const request = await CertificationRequest.create({
    user: userId,
    cvUrl,
    experience,
    motivation,
    techExpertise,
  });

  await User.findByIdAndUpdate(existingUser._id, { reviewerStatus: "pending" , isVerifiedReviewer: false});

  certificationLogger.logCertificationApplied(existingUser._id.toString(), request._id.toString(), techExpertise);

  return request;
};

exports.getAllRequests = async () => {
  return await CertificationRequest.find().populate("user", "name email role reviewerStatus isVerifiedReviewer");
};

exports.approve = async (certificationRequestId, adminNotes) => {
  const request = await CertificationRequest.findById(certificationRequestId);
  if (!request) {
    throw new AppError("Certification request not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  if (request.status !== "pending") {
    throw new AppError("Only pending certification requests can be approved.", 409, ERROR_CODES.DUPLICATE);
  }

  request.status = "approved";
  request.adminNotes = adminNotes;
  request.reviewedAt = new Date();
  await request.save();

  await User.findByIdAndUpdate(request.user, {
    isVerifiedReviewer: true,
    reviewerStatus: "approved",
    role: "reviewer",
  });

  certificationLogger.logCertificationApproved("system", request._id.toString(), adminNotes);

  return request;
};

exports.reject = async (certificationRequestId, adminNotes) => {
  const request = await CertificationRequest.findById(certificationRequestId);
  if (!request) {
    throw new AppError("Certification request not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  if (request.status !== "pending") {
    throw new AppError("Only pending certification requests can be rejected.", 409, ERROR_CODES.DUPLICATE);
  }

  request.status = "rejected";
  request.adminNotes = adminNotes;
  request.reviewedAt = new Date();
  await request.save();

  await User.findByIdAndUpdate(request.user, { reviewerStatus: "rejected", isVerifiedReviewer: false });

  certificationLogger.logCertificationRejected("system", request._id.toString(), adminNotes);

  return request;
};

exports.getCertificationRequestById = async (certificationRequestId) => {
  const request = await CertificationRequest.findById(certificationRequestId).populate(
    "user",
    "name email role reviewerStatus isVerifiedReviewer"
  );
  if (!request) {
    throw new AppError("Certification request not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  return request;
};