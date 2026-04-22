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

// Get all projects query validator
exports.validateGetAllProjectsQuery = [
  query("userId")
    .optional()
    .isMongoId()
    .withMessage("userId must be a valid MongoDB ID"),
  query("status")
    .optional()
    .isIn(["seeking-review", "under-review", "reviewed", "archived"])
    .withMessage("status must be one of: seeking-review, under-review, reviewed, archived"),
  query("techStack")
    .optional()
    .isArray()
    .withMessage("techStack must be a string"),
  (req, res, next) => {
    const validParams = ["userId", "status", "techStack"];
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

// Create project validator
exports.validateCreateProject = [
  body("userId")
    .trim()
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ID"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters long"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long"),
  body("repoUrl")
    .trim()
    .notEmpty()
    .withMessage("Repository URL is required")
    .isURL()
    .withMessage("Repository URL must be a valid URL"),
  body("liveUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Live URL must be a valid URL"),
  body("techStack")
    .isArray({ min: 1 })
    .withMessage("Tech stack must be a non-empty array"),
  body("techStack.*")
    .trim()
    .notEmpty()
    .withMessage("Each tech stack item must be a non-empty string"),
  body("status")
    .isIn(["seeking-review", "under-review", "reviewed", "archived"])
    .withMessage("Status must be one of: seeking-review, under-review, reviewed, archived"),
  handleValidationErrors,
];

// Update project validator
exports.validateUpdateProject = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters long"),
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Description cannot be empty")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long"),
  body("repoUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Repository URL must be a valid URL"),
  body("liveUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Live URL must be a valid URL"),
  body("techStack")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Tech stack must be a non-empty array"),
  body("techStack.*")
    .trim()
    .notEmpty()
    .withMessage("Each tech stack item must be a non-empty string"),
  body("status")
    .optional()
    .isIn(["seeking-review", "under-review", "reviewed", "archived"])
    .withMessage("Status must be one of: seeking-review, under-review, reviewed, archived"),
  handleValidationErrors,
];
