require("dotenv").config();
const express = require("express");
const path = require("path");
const connectMongoDB = require("./config/mongodb.js");
const sequelize = require("./config/sqlite.js");

const { attachCurrentUser } = require("./middleware/webAuth");
const { registerEventListeners } = require("./listeners/registerEventListeners.js");
const appRoutes = require("./routes/appRoutes.js");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

registerEventListeners();

// Attach current user to all requests
app.use(attachCurrentUser);

// Mount app routes (SSR app)
app.use("/", appRoutes);

app.use((req, res, next) => {
  return res.status(404).render("pages/not-found", {
    pageTitle: "Page not found",
    bodyClass: "not-found-body",
    message: "The page you requested does not exist.",
  });
});

// Global error handler (4 params required for Express to treat this as error handler)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isDevelopment = process.env.NODE_ENV !== "production";

  console.error("[Error Handler]", {
    statusCode,
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
  });

  // AppError with custom status code
  if (err.isAppError) {
    return res.status(statusCode).render("pages/not-found", {
      pageTitle: "Something went wrong",
      bodyClass: "not-found-body",
      message: err.message,
    });
  }

  // Generic error fallback
  return res.status(500).render("pages/not-found", {
    pageTitle: "Internal Server Error",
    bodyClass: "not-found-body",
    message: isDevelopment ? err.message : "An unexpected error occurred.",
  });
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
