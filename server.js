require("dotenv").config();
const express = require("express");
const path = require("path");
const connectMongoDB = require("./config/mongodb.js");
const sequelize = require("./config/sqlite.js");

const userRoutes = require("./routes/userRoutes.js");
const projectRoutes = require("./routes/projectRoutes.js");
const reviewRoutes = require("./routes/reviewRoutes.js");
const skillRoutes = require("./routes/skillRoutes.js");
const certificationRoutes = require("./routes/certificationRoutes.js");
const activityLogRoutes = require("./routes/activityLogRoutes.js");
const webRoutes = require("./routes/webRoutes.js");
const { registerEventListeners } = require("./listeners/registerEventListeners.js");
const { swaggerUi, swaggerDocument } = require("./docs/swagger.config.js");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

registerEventListeners();

// Swagger/OpenAPI documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/certifications", certificationRoutes);
app.use("/api/logs", activityLogRoutes);
app.use("/", webRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  return res.status(404).render("pages/not-found", {
    pageTitle: "Page not found",
    bodyClass: "not-found-body",
  });
});

// Global JSON error handler
app.use((err, req, res, next) => {
  if (err.isAppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      errorCode: err.errorCode || "ERR_GENERIC",
    });
  }
  console.error("[Unhandled Error]", err.stack);
  res.status(500).json({ error: "Internal Server Error", errorCode: "ERR_INTERNAL" });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectMongoDB();
    await sequelize.sync();
    console.log("SQLite synced successfully");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
