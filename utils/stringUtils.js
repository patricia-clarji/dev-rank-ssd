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

function parseCsv(csvValue) {
  return String(csvValue || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = {
  toActionLabel,
  isObjectId,
  parseCsv,
};
