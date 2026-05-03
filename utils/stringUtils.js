// String and validation utilities

function toActionLabel(action) {
  return String(action || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ""));
}

function sanitizeText(value) {
  const text = String(value || "");
  const withoutTags = text.replace(/<[^>]*>/g, "");
  const withoutControls = withoutTags.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  return withoutControls.trim();
}

function sanitizeUrl(value) {
  const text = sanitizeText(value);
  if (!text) return "";
  if (/^(javascript|data):/i.test(text.trim())) return "";
  return text;
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidUsername(value) {
  return /^[a-z0-9_-]{3,30}$/.test(String(value || "").trim());
}

function parseCsv(csvValue) {
  return String(csvValue || "")
    .split(",")
    .map((item) => sanitizeText(item))
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = {
  toActionLabel,
  isObjectId,
  sanitizeText,
  sanitizeUrl,
  normalizeUsername,
  isValidUsername,
  parseCsv,
};
