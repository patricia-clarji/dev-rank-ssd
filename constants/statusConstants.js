// Status constants to replace magic strings throughout the application
const PROJECT_STATUSES = Object.freeze({
  DRAFT: "draft",
  SEEKING_REVIEW: "seeking-review",
  UNDER_REVIEW: "under-review",
  REVIEWED: "reviewed",
  ARCHIVED: "archived",
  PUBLISHED: "published",
});

const REVIEW_STATUSES = Object.freeze({
  PUBLISHED: "published",
});

const CERTIFICATION_STATUSES = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

const USER_CERTIFICATION_STATUSES = Object.freeze({
  CERTIFIED: "certified",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  NOT_APPLIED: "not-applied"
});

const FILTER_STATUSES = Object.freeze({
  ALL: "all",
  ...PROJECT_STATUSES,
  ...CERTIFICATION_STATUSES,
});

const PROJECT_STATUS_VALUES = Object.freeze(Object.values(PROJECT_STATUSES));
const REVIEW_STATUS_VALUES = Object.freeze(Object.values(REVIEW_STATUSES));
const CERTIFICATION_STATUS_VALUES = Object.freeze(Object.values(CERTIFICATION_STATUSES));
const FILTER_STATUS_VALUES = Object.freeze(Object.values(FILTER_STATUSES));

module.exports = {
  PROJECT_STATUSES,
  REVIEW_STATUSES,
  CERTIFICATION_STATUSES,
  USER_CERTIFICATION_STATUSES,
  FILTER_STATUSES,
  PROJECT_STATUS_VALUES,
  REVIEW_STATUS_VALUES,
  CERTIFICATION_STATUS_VALUES,
  FILTER_STATUS_VALUES,
};