const { body, param, validationResult } = require("express-validator");

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

// Register user validator
exports.validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .isIn(["developer", "reviewer"])
    .withMessage("Role must be either 'developer' or 'reviewer'"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must not exceed 500 characters"),
  body("githubUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("GitHub URL must be a valid URL"),
  body("avatarUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Avatar URL must be a valid URL"),
  handleValidationErrors,
];

// Update user validator
exports.validateUpdateUser = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must not exceed 500 characters"),
  body("githubUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("GitHub URL must be a valid URL"),
  body("avatarUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Avatar URL must be a valid URL"),
  handleValidationErrors,
];

// Validate skill array for adding skills
exports.validateAddSkills = [
  body("skills")
    .isArray({ min: 1 })
    .withMessage("Skills must be a non-empty array"),
  body("skills.*")
    .trim()
    .notEmpty()
    .withMessage("Each skill must be a non-empty string"),
  handleValidationErrors,
];

// Validate skill array for removing skills
exports.validateRemoveSkills = [
  body("skills")
    .isArray({ min: 1 })
    .withMessage("Skills must be a non-empty array"),
  body("skills.*")
    .trim()
    .notEmpty()
    .withMessage("Each skill must be a non-empty string"),
  handleValidationErrors,
];

// Validate user ID in URL params (for follow/unfollow operations)
exports.validateFollowTarget = [
  param("targetId")
    .isMongoId()
    .withMessage("Target ID must be a valid user ID"),
  handleValidationErrors,
];

// Validate user ID in URL params (for getting followers/following)
exports.validateUserIdParam = [
  param("userId")
    .isMongoId()
    .withMessage("User ID must be a valid user ID"),
  handleValidationErrors,
];

// Validate follow/unfollow request body (requires userId)
exports.validateFollowRequest = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("User ID must be a valid user ID"),
  handleValidationErrors,
];
