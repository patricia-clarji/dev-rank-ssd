/**
 * Certification Factory
 * Creates test CertificationRequest instances with sensible defaults
 */

const mongoose = require("mongoose");
const CertificationRequest = require("../../models/mongo/CertificationRequest");

/**
 * Default certification data
 */
const DEFAULT_CERTIFICATION = {
  experience: "I have 5 years of experience with cloud architecture and DevOps",
  motivation: "I want to validate my expertise in AWS solutions architecture",
  techExpertise: ["AWS", "Docker", "Kubernetes"],
  cvUrl: "https://example.com/cv.pdf",
};

/**
 * Creates a single test certification request
 * @param {string|Object} userIdOrData - User ID or full certification data with userId
 * @param {Object} overrides - Property overrides for the default certification
 * @returns {Promise<Object>} Created certification request
 */
async function createCertification(userIdOrData, overrides = {}) {
  let data;
  // If first arg is a user id (string or ObjectId), treat it as the user
  if (typeof userIdOrData === "string" || mongoose.isValidObjectId(userIdOrData)) {
    data = { ...DEFAULT_CERTIFICATION, user: userIdOrData, ...overrides };
  } else {
    data = { ...DEFAULT_CERTIFICATION, ...userIdOrData, ...overrides };
  }

  return CertificationRequest.create(data);
}

/**
 * Creates multiple test certification requests
 * @param {string} userId - User ID for all certifications
 * @param {number} count - Number of certifications to create
 * @param {Function} overrideFn - Function to generate unique overrides per certification
 * @returns {Promise<Array>} Array of created certification requests
 */
async function createCertifications(userId, count = 1, overrideFn) {
  const certifications = [];
  const defaultCertifications = [
    {
      experience: "I have 5 years of experience with cloud architecture and DevOps",
      motivation: "I want to validate my expertise in AWS solutions architecture",
      techExpertise: ["AWS", "Docker", "Kubernetes"],
      cvUrl: "https://example.com/cv.pdf",
    },
    {
      experience: "I have worked with Google Cloud Platform for 3 years in production environments",
      motivation: "I am seeking professional recognition for my Google Cloud expertise",
      techExpertise: ["GCP", "BigQuery", "Cloud Run"],
    },
    {
      experience: "I have 7 years of Kubernetes and container orchestration experience",
      motivation: "I want to get certified in Kubernetes administration",
      techExpertise: ["Kubernetes", "Docker", "Helm"],
      cvUrl: "https://example.com/cv-k8s.pdf",
    },
  ];

  for (let i = 0; i < count; i++) {
    const base = defaultCertifications[i] || DEFAULT_CERTIFICATION;
    const overrides = overrideFn ? overrideFn(i) : {};
    certifications.push(
      await createCertification(userId, { ...base, ...overrides })
    );
  }
  return certifications;
}

module.exports = {
  createCertification,
  createCertifications,
  DEFAULT_CERTIFICATION,
};
