module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "routes/**/*.js",
    "services/**/*.js",
    "models/**/*.js",
    "!**/node_modules/**",
  ],
  coveragePathIgnorePatterns: ["/node_modules/"],
  testTimeout: 10000,
  verbose: true,
};
