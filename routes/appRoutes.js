const express = require("express");

const publicRoutes = require("./publicRoutes");
const authRoutes = require("./authRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const projectRoutes = require("./projectRoutes");
const skillRoutes = require("./skillRoutes");
const reviewRoutes = require("./reviewRoutes");
const certificationRoutes = require("./certificationRoutes");
const profileRoutes = require("./profileRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.use(publicRoutes);
router.use(authRoutes);
router.use(dashboardRoutes);
router.use(projectRoutes);
router.use(skillRoutes);
router.use(reviewRoutes);
router.use(certificationRoutes);
router.use(profileRoutes);
router.use(adminRoutes);

module.exports = router;
