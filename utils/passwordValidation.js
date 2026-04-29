const PASSWORD_REQUIREMENTS = Object.freeze([
    {
        key: "minLength",
        label: "At least 8 characters",
        test: (password) => password.length >= 8,
    },
    {
        key: "uppercase",
        label: "At least 1 uppercase letter",
        test: (password) => /[A-Z]/.test(password),
    },
    {
        key: "lowercase",
        label: "At least 1 lowercase letter",
        test: (password) => /[a-z]/.test(password),
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

const PASSWORD_REQUIREMENTS_MESSAGE = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

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

module.exports = {
    PASSWORD_REQUIREMENTS,
    PASSWORD_REQUIREMENTS_MESSAGE,
    validatePassword,
};
