const bcrypt = require("bcrypt");
const User = require("../models/mongo/User");
const userService = require("../services/userService");
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
};

exports.loginPage = (req, res) => {
  const errorCode = req.query.error;
  const errorMessage = errorCode ? errorMessages[errorCode] : null;

  return res.render("pages/auth", {
    pageTitle: "Sign in",
    bodyClass: "auth-body",
    mode: "login",
    errorMessage,
    successMessage: null,
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

    res.cookie("devrank_user", encodeURIComponent(user._id.toString()), {
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

    const userId = user._id.toString();
    console.log("[Register] User created with ID:", userId);
    
    res.cookie("devrank_user", encodeURIComponent(userId), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
    });

    console.log("[Register] Cookie set, redirecting to /dashboard");
    return res.redirect("/dashboard");
  } catch (error) {
    if (error.statusCode === 409) {
      return res.redirect("/register?error=email_exists");
    }
    return res.redirect("/register?error=server_error");
  }
};

exports.logout = (req, res) => {
  res.clearCookie("devrank_user");
  return res.redirect("/login");
};
