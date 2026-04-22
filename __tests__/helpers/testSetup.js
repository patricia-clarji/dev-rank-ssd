/**
 * Test Setup Helper
 * Centralizes Express app configuration and error handling for all API tests
 */

const express = require("express");

/**
 * Creates a configured Express test app with error handler middleware
 * @param {string} routePath - API route path (e.g., "/api/logs")
 * @param {Router} router - Express router to mount
 * @returns {Express.Application} Configured test app
 */
function createTestApp(routePath, router) {
  const app = express();

  // Middleware
  app.use(express.json());
  
  // Mount routes
  app.use(routePath, router);

  // Error handler middleware
  app.use((err, req, res, next) => {
    if (err.isAppError) {
      return res.status(err.statusCode).json({
        error: err.message,
        errorCode: err.errorCode || "ERR_GENERIC",
      });
    }
    res.status(500).json({ 
      error: "Internal Server Error", 
      errorCode: "ERR_INTERNAL" 
    });
  });

  return app;
}

module.exports = {
  createTestApp,
};
