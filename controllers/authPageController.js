const authService = require("../services/authService");
const { generateToken } = require("../middleware/webAuth");
const { content } = require("../utils/viewRenderer");

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

function getAuthErrorCode(error, fallbackCode = "server_error") {
  switch (error && error.errorCode) {
    case authService.AUTH_ERROR_CODES.INVALID_CREDENTIALS:
      return "invalid_credentials";
    case authService.AUTH_ERROR_CODES.MISSING_FIELDS:
      return "missing_fields";
    case authService.AUTH_ERROR_CODES.PASSWORD_MISMATCH:
      return "password_mismatch";
    case authService.AUTH_ERROR_CODES.PASSWORD_TOO_SHORT:
      return "password_too_short";
    case authService.AUTH_ERROR_CODES.EMAIL_EXISTS:
      return "email_exists";
    case authService.AUTH_ERROR_CODES.INVALID_TOKEN:
      return "invalid_token";
    default:
      return fallbackCode;
  }
}

exports.loginPage = (req, res) => {
  const errorCode = req.query.error;
  const errorMessage = errorCode ? errorMessages[errorCode] : null;
  const successCode = req.query.success;
  const successMessage = successCode === "password_reset"
    ? "Password reset successfully. Please sign in with your new password."
    : null;

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
    const user = await authService.getResetPasswordUser(token);

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
    const user = await authService.loginWithCredentials(req.body);
    const token = generateToken(user._id.toString());

    res.cookie("devrank_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.redirect("/dashboard");
  } catch (error) {
    return res.redirect(`/login?error=${getAuthErrorCode(error, "server_error")}`);
  }
};

exports.handleRegister = async (req, res) => {
  try {
    const user = await authService.registerWithCredentials(req.body);
    const token = generateToken(user._id.toString());

    res.cookie("devrank_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
    });

    return res.redirect("/dashboard");
  } catch (error) {
    return res.redirect(`/register?error=${getAuthErrorCode(error, "server_error")}`);
  }
};

exports.logout = (req, res) => {
  res.clearCookie("devrank_token");
  return res.redirect("/login");
};

exports.handleForgotPassword = async (req, res) => {
  try {
    await authService.requestPasswordReset({
      email: req.body.email,
      baseUrl: `${req.protocol}://${req.get("host")}`,
    });

    return res.redirect("/forgot-password?success=true");
  } catch (error) {
    return res.redirect(`/forgot-password?error=${getAuthErrorCode(error, "server_error")}`);
  }
};

exports.handleResetPassword = async (req, res) => {
  try {
    await authService.resetPassword({
      token: req.params.token,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });

    return res.redirect("/login?success=password_reset");
  } catch (error) {
    return res.redirect(`/reset-password/${req.params.token}?error=${getAuthErrorCode(error, "server_error")}`);
  }
};