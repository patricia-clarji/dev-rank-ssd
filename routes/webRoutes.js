const express = require("express");
const router = express.Router();
const { attachCurrentUser } = require("../middleware/webAuth");
const publicController = require("../controllers/publicPageController");
const publicRoutes = require("./web/publicRoutes");
const authRoutes = require("./web/authRoutes");
const appRoutes = require("./web/appRoutes");
const adminRoutes = require("./web/adminRoutes");

router.use(attachCurrentUser);

router.use(publicRoutes);
router.use(authRoutes);
router.use(appRoutes);
router.use(adminRoutes);

router.use(publicController.notFound);

module.exports = router;