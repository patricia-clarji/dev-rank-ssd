const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/mongo/User");
const userService = require("../services/userService");
const AppError = require("../utils/AppError");
const { normalizeUsername, isValidUsername } = require("../utils/stringUtils");

const PASSWORD_REQUIREMENTS = Object.freeze([
  {
    key: "minLength",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    key: "number",
    label: "At least 1 number",
    test: (password) => /\d/.test(password),
  },
  {
    key: "special",
    label: "At least 1 special character",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
]);

const PASSWORD_REQUIREMENTS_MESSAGE = "Password must be at least 8 characters and include a number and special character.";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  return EMAIL_REGEX.test(String(email || "").trim().toLowerCase());
}

function validatePassword(password) {
  const candidatePassword = String(password || "");
  const requirements = PASSWORD_REQUIREMENTS.map((requirement) => ({
    key: requirement.key,
    label: requirement.label,
    met: requirement.test(candidatePassword),
  }));

  const missingRequirements = requirements.filter((requirement) => !requirement.met);

  return {
    isValid: missingRequirements.length === 0,
    requirements,
    missingRequirements,
    missingLabels: missingRequirements.map((requirement) => requirement.label),
  };
}

const AUTH_ERROR_CODES = Object.freeze({
  INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  MISSING_FIELDS: "AUTH_MISSING_FIELDS",
  INVALID_EMAIL: "AUTH_INVALID_EMAIL",
  PASSWORD_MISMATCH: "AUTH_PASSWORD_MISMATCH",
  PASSWORD_WEAK: "AUTH_PASSWORD_WEAK",
  EMAIL_EXISTS: "AUTH_EMAIL_EXISTS",
  INVALID_USERNAME: "AUTH_INVALID_USERNAME",
  INVALID_TOKEN: "AUTH_INVALID_TOKEN",
});

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function createAuthError(message, statusCode, errorCode) {
  return new AppError(message, statusCode, errorCode);
}

async function loginWithCredentials({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const candidatePassword = String(password || "");

  if (!normalizedEmail || !candidatePassword || !validateEmail(normalizedEmail)) {
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

  if (!validateEmail(normalizedEmail)) {
    throw createAuthError("Please enter a valid email address", 400, AUTH_ERROR_CODES.INVALID_EMAIL);
  }

  if (candidatePassword !== confirmedPassword) {
    throw createAuthError("Passwords do not match", 400, AUTH_ERROR_CODES.PASSWORD_MISMATCH);
  }

  if (!validatePassword(candidatePassword).isValid) {
    throw createAuthError(PASSWORD_REQUIREMENTS_MESSAGE, 400, AUTH_ERROR_CODES.PASSWORD_WEAK);
  }

  const normalizedUsername = normalizeUsername(username);
  if (username && !isValidUsername(normalizedUsername)) {
    throw createAuthError(
      "Username may only contain letters, numbers, underscores, and hyphens, and must be 3-30 characters long.",
      400,
      AUTH_ERROR_CODES.INVALID_USERNAME
    );
  }

  try {
    return await userService.registerUser({
      username: normalizedUsername || undefined,
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

const errorMessages = {
  invalid_credentials: "Invalid email or password",
  password_weak: PASSWORD_REQUIREMENTS_MESSAGE,
  password_mismatch: "Passwords do not match",
  missing_fields: "Please fill in all required fields",
  invalid_email: "Please enter a valid email address",
  email_exists: "This email is already registered",
  server_error: "An error occurred. Please try again",
  user_exists: "Username already taken",
  invalid_username: "Username may only contain letters, numbers, underscores, and hyphens, and must be 3-30 characters long.",
  invalid_token: "Invalid or expired reset token",
};

function getAuthErrorCode(error, fallbackCode = "server_error") {
  switch (error && error.errorCode) {
    case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
      return "invalid_credentials";
    case AUTH_ERROR_CODES.MISSING_FIELDS:
      return "missing_fields";
    case AUTH_ERROR_CODES.INVALID_EMAIL:
      return "invalid_email";
    case AUTH_ERROR_CODES.PASSWORD_MISMATCH:
      return "password_mismatch";
    case AUTH_ERROR_CODES.PASSWORD_WEAK:
      return "password_weak";
    case AUTH_ERROR_CODES.EMAIL_EXISTS:
      return "email_exists";
    case AUTH_ERROR_CODES.INVALID_TOKEN:
      return "invalid_token";
    default:
      return fallbackCode;
  }
}

module.exports = {
  AUTH_ERROR_CODES,
  loginWithCredentials,
  registerWithCredentials,
  getResetPasswordUser,
  requestPasswordReset,
  resetPassword,
  getAuthErrorCode,
  errorMessages,
};
