const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/mongo/User");
const userService = require("../services/userService");
const { generateToken } = require("../middleware/webAuth");
const { content } = require("./viewModel");

// Error message mapping
const errorMessages = {
  invalid_credentials: "Invalid email or password",
  password_too_short: "Password must be at least 6 characters",
  password_mismatch: "Passwords do not match",
  missing_fields: "Please fill in all required fields",
  email_exists: "This email is already registered",
  server_error: "An error occurred. Please try again",
  user_exists: "Username already taken",
  invalid_token: "Invalid or expired reset token",
};

exports.loginPage = (req, res) => {
  const errorCode = req.query.error;
  const errorMessage = errorCode ? errorMessages[errorCode] : null;
  const successCode = req.query.success;
  const successMessage = successCode === "password_reset" ? "Password reset successfully. Please sign in with your new password." : null;

  return res.render("pages/auth", {
    pageTitle: "Sign in",
    bodyClass: "auth-body",
    mode: "login",
    errorMessage,
    successMessage,
    warningMessage: null,
    ...content,
  });
};

exports.registerPage = (req, res) => {
  const errorCode = req.query.error;
  const errorMessage = errorCode ? errorMessages[errorCode] : null;

  return res.render("pages/auth", {
    pageTitle: "Create account",
    bodyClass: "auth-body",
    mode: "register",
    errorMessage,
    successMessage: null,
    warningMessage: null,
    ...content,
  });
};

exports.forgotPasswordPage = (req, res) => {
  const errorCode = req.query.error;
  const errorMessage = errorCode ? errorMessages[errorCode] : null;
  const successCode = req.query.success;
  const successMessage = successCode ? "Password reset link sent to your email" : null;

  return res.render("pages/forgotPassword", {
    pageTitle: "Forgot password",
    bodyClass: "auth-body",
    errorMessage,
    successMessage,
    warningMessage: null,
    ...content,
  });
};

exports.resetPasswordPage = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.render("pages/resetPassword", {
        pageTitle: "Reset password",
        bodyClass: "auth-body",
        errorMessage: "Invalid or expired reset token",
        successMessage: null,
        warningMessage: null,
        token: null,
        ...content,
      });
    }

    return res.render("pages/resetPassword", {
      pageTitle: "Reset password",
      bodyClass: "auth-body",
      errorMessage: null,
      successMessage: null,
      warningMessage: null,
      token,
      ...content,
    });
  } catch (error) {
    return res.render("pages/resetPassword", {
      pageTitle: "Reset password",
      bodyClass: "auth-body",
      errorMessage: "An error occurred",
      successMessage: null,
      warningMessage: null,
      token: null,
      ...content,
    });
  }
};

exports.handleLogin = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.redirect("/login?error=invalid_credentials");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect("/login?error=invalid_credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.redirect("/login?error=invalid_credentials");
    }

    const token = generateToken(user._id.toString());

    res.cookie("devrank_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.redirect("/dashboard");
  } catch (error) {
    return res.redirect("/login?error=server_error");
  }
};

exports.handleRegister = async (req, res) => {
  try {
    const { username, name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.redirect("/register?error=missing_fields");
    }

    if (password !== confirmPassword) {
      return res.redirect("/register?error=password_mismatch");
    }

    if (password.length < 6) {
      return res.redirect("/register?error=password_too_short");
    }

    const user = await userService.registerUser({
      username,
      name,
      email,
      password,
      role: "developer",
    });

    const token = generateToken(user._id.toString());
    
    res.cookie("devrank_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
    });

    return res.redirect("/dashboard");
  } catch (error) {
    if (error.statusCode === 409) {
      return res.redirect("/register?error=email_exists");
    }
    return res.redirect("/register?error=server_error");
  }
};

exports.logout = (req, res) => {
  res.clearCookie("devrank_token");
  return res.redirect("/login");
};

exports.handleForgotPassword = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.redirect("/forgot-password?error=missing_fields");
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.redirect("/forgot-password?success=true");
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail", // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset - DevRank",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your DevRank account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.redirect("/forgot-password?success=true");
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.redirect("/forgot-password?error=server_error");
  }
};

exports.handleResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.redirect(`/reset-password/${token}?error=missing_fields`);
    }

    if (password !== confirmPassword) {
      return res.redirect(`/reset-password/${token}?error=password_mismatch`);
    }

    if (password.length < 6) {
      return res.redirect(`/reset-password/${token}?error=password_too_short`);
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect(`/reset-password/${token}?error=invalid_token`);
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.redirect("/login?success=password_reset");
  } catch (error) {
    console.error("Reset password error:", error);
    return res.redirect(`/reset-password/${req.params.token}?error=server_error`);
  }
};
