const { body, query, validationResult } = require("express-validator");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      errorCode: "ERR_VALIDATION",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Get all reviews query validator
exports.validateGetAllReviewsQuery = [
  query("projectId")
    .optional()
    .isMongoId()
    .withMessage("projectId must be a valid MongoDB ID"),
  query("reviewerId")
    .optional()
    .isMongoId()
    .withMessage("reviewerId must be a valid MongoDB ID"),
  query("status")
    .optional()
    .isIn(["published", "removed"])
    .withMessage("status must be either 'published' or 'removed'"),
  (req, res, next) => {
    const validParams = ["projectId", "reviewerId", "status"];
    const invalidParams = Object.keys(req.query).filter(
      (param) => !validParams.includes(param)
    );
    if (invalidParams.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        errorCode: "ERR_VALIDATION",
        errors: invalidParams.map((param) => ({
          field: param,
          message: `Unknown parameter`,
        })),
      });
    }
    next();
  },
  handleValidationErrors,
];

// Create review validator
exports.validateCreateReview = [
  body("projectId")
    .trim()
    .notEmpty()
    .withMessage("Project ID is required")
    .isMongoId()
    .withMessage("projectId must be a valid MongoDB ID"),
  body("reviewerId")
    .trim()
    .notEmpty()
    .withMessage("Reviewer ID is required")
    .isMongoId()
    .withMessage("reviewerId must be a valid MongoDB ID"),
  body("overallRating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Overall rating must be between 1 and 5"),
  body("codeQualityScore")
    .isInt({ min: 1, max: 5 })
    .withMessage("Code quality score must be between 1 and 5"),
  body("creativityScore")
    .isInt({ min: 1, max: 5 })
    .withMessage("Creativity score must be between 1 and 5"),
  body("cleanCodeScore")
    .isInt({ min: 1, max: 5 })
    .withMessage("Clean code score must be between 1 and 5"),
  body("wouldHire")
    .optional()
    .isBoolean()
    .withMessage("wouldHire must be a boolean"),
  body("generalFeedback")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("General feedback must not exceed 1000 characters"),
  body("suggestions")
    .optional()
    .isArray()
    .withMessage("Suggestions must be an array"),
  body("suggestions.*")
    .trim()
    .notEmpty()
    .withMessage("Each suggestion must be a non-empty string"),
  handleValidationErrors,
];

// Update review validator
exports.validateUpdateReview = [
  body("overallRating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Overall rating must be between 1 and 5"),
  body("codeQualityScore")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Code quality score must be between 1 and 5"),
  body("creativityScore")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Creativity score must be between 1 and 5"),
  body("cleanCodeScore")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Clean code score must be between 1 and 5"),
  body("wouldHire")
    .optional()
    .isBoolean()
    .withMessage("wouldHire must be a boolean"),
  body("generalFeedback")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("General feedback must not exceed 1000 characters"),
  body("suggestions")
    .optional()
    .isArray()
    .withMessage("Suggestions must be an array"),
  body("suggestions.*")
    .trim()
    .notEmpty()
    .withMessage("Each suggestion must be a non-empty string"),
  handleValidationErrors,
];
