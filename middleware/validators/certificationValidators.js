const { body, validationResult } = require("express-validator");

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

// Create certification request validator
exports.validateCreateCertificationRequest = [
  body("userId")
    .trim()
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("userId must be a valid MongoDB ID"),
  body("cvUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("CV URL must be a valid URL"),
  body("experience")
    .trim()
    .notEmpty()
    .withMessage("Experience is required")
    .isLength({ min: 10 })
    .withMessage("Experience description must be at least 10 characters long"),
  body("motivation")
    .trim()
    .notEmpty()
    .withMessage("Motivation is required")
    .isLength({ min: 10 })
    .withMessage("Motivation must be at least 10 characters long"),
  body("techExpertise")
    .optional()
    .isArray()
    .withMessage("Tech expertise must be an array"),
  body("techExpertise.*")
    .trim()
    .notEmpty()
    .withMessage("Each tech expertise item must be a non-empty string"),
  handleValidationErrors,
];

// Update certification request validator (for admin review)
exports.validateUpdateCertificationRequest = [
  body("status")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Status must be one of: pending, approved, rejected"),
  body("adminNotes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Admin notes must not exceed 500 characters"),
  handleValidationErrors,
];
