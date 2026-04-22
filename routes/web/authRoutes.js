const express = require("express");
const { requireAuth, requireGuest } = require("../../middleware/webAuth");
const authController = require("../../controllers/authPageController");

const router = express.Router();

router.get("/login", requireGuest, authController.loginPage);
router.post("/login", requireGuest, authController.handleLogin);
router.get("/register", requireGuest, authController.registerPage);
router.post("/register", requireGuest, authController.handleRegister);
router.post("/logout", requireAuth, authController.logout);

module.exports = router;
