class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string} [errorCode] - Optional machine-readable error code
   */
  constructor(message, statusCode = 500, errorCode = "ERR_GENERIC") {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isAppError = true;
  }
}

module.exports = AppError;
