const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/mongo/User");
const userService = require("../services/userService");
const AppError = require("../utils/AppError");
const {
  PASSWORD_REQUIREMENTS_MESSAGE,
  validatePassword,
} = require("../utils/passwordValidation");

const AUTH_ERROR_CODES = Object.freeze({
  INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  MISSING_FIELDS: "AUTH_MISSING_FIELDS",
  PASSWORD_MISMATCH: "AUTH_PASSWORD_MISMATCH",
  PASSWORD_WEAK: "AUTH_PASSWORD_WEAK",
  EMAIL_EXISTS: "AUTH_EMAIL_EXISTS",
  INVALID_TOKEN: "AUTH_INVALID_TOKEN",
});

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function createAuthError(message, statusCode, errorCode) {
  return new AppError(message, statusCode, errorCode);
}

async function loginWithCredentials({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const candidatePassword = String(password || "");

  if (!normalizedEmail || !candidatePassword) {
    throw createAuthError("Invalid email or password", 401, AUTH_ERROR_CODES.INVALID_CREDENTIALS);
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw createAuthError("Invalid email or password", 401, AUTH_ERROR_CODES.INVALID_CREDENTIALS);
  }

  const isValidPassword = await bcrypt.compare(candidatePassword, user.passwordHash);
  if (!isValidPassword) {
    throw createAuthError("Invalid email or password", 401, AUTH_ERROR_CODES.INVALID_CREDENTIALS);
  }

  return user;
}

async function registerWithCredentials({ username, name, email, password, confirmPassword }) {
  const normalizedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim();
  const candidatePassword = String(password || "");
  const confirmedPassword = String(confirmPassword || "");

  if (!normalizedName || !normalizedEmail || !candidatePassword || !confirmedPassword) {
    throw createAuthError("Please fill in all required fields", 400, AUTH_ERROR_CODES.MISSING_FIELDS);
  }

  if (candidatePassword !== confirmedPassword) {
    throw createAuthError("Passwords do not match", 400, AUTH_ERROR_CODES.PASSWORD_MISMATCH);
  }

  if (!validatePassword(candidatePassword).isValid) {
    throw createAuthError(PASSWORD_REQUIREMENTS_MESSAGE, 400, AUTH_ERROR_CODES.PASSWORD_WEAK);
  }

  try {
    return await userService.registerUser({
      username,
      name: normalizedName,
      email: normalizedEmail,
      password: candidatePassword,
      role: "developer",
    });
  } catch (error) {
    if (error && error.statusCode === 409) {
      throw createAuthError("This email is already registered", 409, AUTH_ERROR_CODES.EMAIL_EXISTS);
    }

    throw error;
  }
}

async function getResetPasswordUser(token) {
  if (!token) return null;

  return await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
}

async function requestPasswordReset({ email, baseUrl }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    throw createAuthError("Please fill in all required fields", 400, AUTH_ERROR_CODES.MISSING_FIELDS);
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return { sent: true };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + RESET_TOKEN_TTL_MS;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetUrl = `${String(baseUrl || "").replace(/\/$/, "")}/reset-password/${resetToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: normalizedEmail,
    subject: "Password Reset - DevRank",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your DevRank account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });

  return { sent: true };
}

async function resetPassword({ token, password, confirmPassword }) {
  const resetToken = String(token || "");
  const candidatePassword = String(password || "");
  const confirmedPassword = String(confirmPassword || "");

  if (!candidatePassword || !confirmedPassword) {
    throw createAuthError("Please fill in all required fields", 400, AUTH_ERROR_CODES.MISSING_FIELDS);
  }

  if (candidatePassword !== confirmedPassword) {
    throw createAuthError("Passwords do not match", 400, AUTH_ERROR_CODES.PASSWORD_MISMATCH);
  }

  if (!validatePassword(candidatePassword).isValid) {
    throw createAuthError(PASSWORD_REQUIREMENTS_MESSAGE, 400, AUTH_ERROR_CODES.PASSWORD_WEAK);
  }

  const user = await getResetPasswordUser(resetToken);
  if (!user) {
    throw createAuthError("Invalid or expired reset token", 400, AUTH_ERROR_CODES.INVALID_TOKEN);
  }

  const passwordHash = await bcrypt.hash(candidatePassword, 10);
  user.passwordHash = passwordHash;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return user;
}

module.exports = {
  AUTH_ERROR_CODES,
  loginWithCredentials,
  registerWithCredentials,
  getResetPasswordUser,
  requestPasswordReset,
  resetPassword,
};
