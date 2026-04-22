require("dotenv").config();
const express = require("express");
const path = require("path");
const connectMongoDB = require("./config/mongodb.js");
const sequelize = require("./config/sqlite.js");

const webRoutes = require("./routes/webRoutes.js");
const { registerEventListeners } = require("./listeners/registerEventListeners.js");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

registerEventListeners();

// Mount web routes only (SSR app)
app.use("/", webRoutes);

app.use((req, res, next) => {
  return res.status(404).render("pages/not-found", {
    pageTitle: "Page not found",
    bodyClass: "not-found-body",
  });
});

// Global error handler (render-based)
app.use((err, req, res, next) => {
  console.error("[Unhandled Error]", err.stack);

  if (err.isAppError) {
    return res.status(err.statusCode).render("pages/not-found", {
      pageTitle: "Something went wrong",
      bodyClass: "not-found-body",
      message: err.message,
    });
  }

  return res.status(500).render("pages/not-found", {
    pageTitle: "Internal Server Error",
    bodyClass: "not-found-body",
    message: "An unexpected error occurred.",
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
