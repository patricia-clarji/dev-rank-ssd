const { query, validationResult } = require("express-validator");

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

// Get all activity logs query validator
exports.validateGetAllLogsQuery = [
  query("userId")
    .optional()
    .isMongoId()
    .withMessage("userId must be a valid MongoDB ID"),
  query("action")
    .optional()
    .isString()
    .withMessage("action must be a string"),
  query("entity")
    .optional()
    .isString()
    .withMessage("entity must be a string"),
  query("entityId")
    .optional()
    .isMongoId()
    .withMessage("entityId must be a valid MongoDB ID"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 date"),
  (req, res, next) => {
    const validParams = ["userId", "action", "entity", "entityId", "startDate", "endDate"];
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
