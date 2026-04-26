const express = require("express");
const { requireAuth, requireGuest } = require("../middleware/webAuth");
const authController = require("../controllers/authPageController");

const router = express.Router();

router.get("/login", requireGuest, authController.loginPage);
router.post("/login", requireGuest, authController.handleLogin);
router.get("/register", requireGuest, authController.registerPage);
router.post("/register", requireGuest, authController.handleRegister);
router.get("/forgot-password", requireGuest, authController.forgotPasswordPage);
router.post("/forgot-password", requireGuest, authController.handleForgotPassword);
router.get("/reset-password/:token", requireGuest, authController.resetPasswordPage);
router.post("/reset-password/:token", requireGuest, authController.handleResetPassword);
router.post("/logout", requireAuth, authController.logout);

module.exports = router;
