const CertificationRequest = require("../models/mongo/CertificationRequest");
const User = require("../models/mongo/User");
const certificationLogger = require("../loggers/certificationLogger");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");
const { CERTIFICATION_STATUSES } = require("../constants/statusConstants");

const VALID_EXPERIENCE_VALUES = new Set(["1-2", "3-5", "5-10", "10+"]);

function getCertificationUserProjection() {
  return "username name email role reviewerStatus isVerifiedReviewer profileScore skills githubUrl bio company location";
}

async function getCertificationRecordByUserId(userId) {
  return CertificationRequest.findOne({ user: userId });
}

function pickLastValue(value) {
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i -= 1) {
      const candidate = String(value[i] || "").trim();
      if (candidate) return candidate;
    }
    return "";
  }

  return String(value || "").trim();
}

function normalizeExpertiseInput(value) {
  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((entry) => String(entry || "").split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function validateOptionalUrl(value, fieldLabel) {
  if (!value) return "";

  try {
    return new URL(value).toString();
  } catch {
    throw new AppError(`${fieldLabel} must be a valid URL.`, 400, ERROR_CODES.VALIDATION);
  }
}

function buildNormalizedApplicationPayload({
  cvUrl,
  linkedinProfile,
  experience,
  motivation,
  techExpertise,
}) {
  const normalizedExperience = pickLastValue(experience);
  const normalizedMotivation = pickLastValue(motivation);
  const normalizedCvUrl = validateOptionalUrl(pickLastValue(cvUrl), "Portfolio URL");
  const normalizedLinkedinProfile = validateOptionalUrl(
    pickLastValue(linkedinProfile),
    "LinkedIn profile"
  );
  const normalizedTechExpertise = normalizeExpertiseInput(techExpertise);

  if (!VALID_EXPERIENCE_VALUES.has(normalizedExperience)) {
    throw new AppError("Experience must match one of the supported ranges.", 400, ERROR_CODES.VALIDATION);
  }

  if (!normalizedMotivation) {
    throw new AppError("Motivation is required.", 400, ERROR_CODES.VALIDATION);
  }

  if (normalizedTechExpertise.length === 0) {
    throw new AppError("At least one area of expertise is required.", 400, ERROR_CODES.VALIDATION);
  }

  return {
    cvUrl: normalizedCvUrl,
    linkedinProfile: normalizedLinkedinProfile,
    experience: normalizedExperience,
    motivation: normalizedMotivation,
    techExpertise: normalizedTechExpertise,
  };
}

function mapDuplicateCertificationError(error) {
  if (error?.code === 11000) {
    throw new AppError("User already has a certification record.", 409, ERROR_CODES.DUPLICATE);
  }

  throw error;
}

exports.apply = async ({ userId, cvUrl, linkedinProfile, experience, motivation, techExpertise }) => {
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const existingRequest = await getCertificationRecordByUserId(userId);
  if (existingRequest && existingRequest.status === CERTIFICATION_STATUSES.PENDING) {
    throw new AppError("User already has a pending certification request.", 409, ERROR_CODES.DUPLICATE);
  }

  if (existingRequest && existingRequest.status === CERTIFICATION_STATUSES.APPROVED) {
    throw new AppError("User is already a certified reviewer.", 409, ERROR_CODES.DUPLICATE);
  }

  const normalizedPayload = buildNormalizedApplicationPayload({
    cvUrl,
    linkedinProfile,
    experience,
    motivation,
    techExpertise,
  });

  const requestPayload = {
    ...normalizedPayload,
    status: CERTIFICATION_STATUSES.PENDING,
    adminNotes: "",
    submittedAt: new Date(),
    reviewedAt: null,
  };

  let request;

  try {
    if (existingRequest) {
      Object.assign(existingRequest, requestPayload);
      request = await existingRequest.save();
    } else {
      request = await CertificationRequest.create({
        user: userId,
        ...requestPayload,
      });
    }
  } catch (error) {
    mapDuplicateCertificationError(error);
  }

  await User.findByIdAndUpdate(existingUser._id, {
    reviewerStatus: CERTIFICATION_STATUSES.PENDING,
    isVerifiedReviewer: false,
    role: "developer",
    linkedin: normalizedPayload.linkedinProfile || existingUser.linkedin || "",
  });

  certificationLogger.logCertificationApplied(
    existingUser._id.toString(),
    request._id.toString(),
    normalizedPayload.techExpertise
  );

  return request;
};

exports.getAllRequests = async () => {
  return await CertificationRequest.find()
    .populate("user", getCertificationUserProjection())
    .sort({ submittedAt: -1 });
};

exports.getRequestByUserId = async (userId) => {
  return await CertificationRequest.findOne({ user: userId })
    .populate("user", getCertificationUserProjection());
};

exports.approve = async (certificationRequestId, adminNotes) => {
  const request = await CertificationRequest.findById(certificationRequestId);
  if (!request) {
    throw new AppError("Certification request not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  if (request.status !== CERTIFICATION_STATUSES.PENDING) {
    throw new AppError("Only pending certification requests can be approved.", 409, ERROR_CODES.DUPLICATE);
  }

  request.status = CERTIFICATION_STATUSES.APPROVED;
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

  if (request.status !== CERTIFICATION_STATUSES.PENDING) {
    throw new AppError("Only pending certification requests can be rejected.", 409, ERROR_CODES.DUPLICATE);
  }

  request.status = CERTIFICATION_STATUSES.REJECTED;
  request.adminNotes = adminNotes;
  request.reviewedAt = new Date();
  await request.save();

  await User.findByIdAndUpdate(request.user, {
    reviewerStatus: "rejected",
    isVerifiedReviewer: false,
  });

  certificationLogger.logCertificationRejected("system", request._id.toString(), adminNotes);

  return request;
};

exports.getCertificationRequestById = async (certificationRequestId) => {
  const request = await CertificationRequest.findById(certificationRequestId).populate(
    "user",
    getCertificationUserProjection()
  );
  if (!request) {
    throw new AppError("Certification request not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  return request;
};