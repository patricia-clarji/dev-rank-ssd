// Sample test data for API tests

const testUsers = [
  {
    name: "John Doe",
    email: "john@test.com",
    password: "password123",
    bio: "Test user",
  },
  {
    name: "Jane Smith",
    email: "jane@test.com",
    password: "password456",
    bio: "Another test user",
  },
  {
    name: "Bob Johnson",
    email: "bob@test.com",
    password: "password789",
    bio: "Third test user",
  },
];

const testProjects = [
  {
    title: "Test Project 1",
    description: "A comprehensive test project description",
    techStack: ["Node.js", "Express"],
    status: "seeking-review",
    repoUrl: "https://github.com/test/project1",
    liveUrl: "https://test-project1.demo.com",
  },
  {
    title: "Test Project 2",
    description: "Another comprehensive test project description",
    techStack: ["React", "MongoDB"],
    status: "under-review",
    repoUrl: "https://github.com/test/project2",
    liveUrl: "https://test-project2.demo.com",
  },
];

const testSkills = [
  {
    name: "JavaScript",
    category: ["backend", "frontend"],
  },
  {
    name: "React",
    category: ["frontend"],
  },
  {
    name: "MongoDB",
    category: ["database"],
  },
];

const testReviews = [
  {
    overallRating: 5,
    codeQualityScore: 5,
    creativityScore: 4,
    cleanCodeScore: 5,
    wouldHire: true,
    generalFeedback: "Excellent project with great code quality!",
    suggestions: ["Consider adding more error handling"],
    status: "published",
  },
  {
    overallRating: 4,
    codeQualityScore: 4,
    creativityScore: 4,
    cleanCodeScore: 4,
    wouldHire: true,
    generalFeedback: "Good work overall with solid implementation",
    suggestions: ["Add more unit tests"],
    status: "published",
  },
  {
    overallRating: 3,
    codeQualityScore: 3,
    creativityScore: 3,
    cleanCodeScore: 3,
    wouldHire: false,
    generalFeedback: "Average performance, needs improvement",
    suggestions: ["Refactor for readability", "Improve documentation"],
    status: "published",
  },
];

const testCertifications = [
  {
    experience: "I have 5 years of experience with cloud architecture and DevOps",
    motivation: "I want to validate my expertise in AWS solutions architecture",
    techExpertise: ["AWS", "Docker", "Kubernetes"],
    cvUrl: "https://example.com/cv.pdf",
  },
  {
    experience: "I have worked with Google Cloud Platform for 3 years in production environments",
    motivation: "I am seeking professional recognition for my Google Cloud expertise",
    techExpertise: ["GCP", "BigQuery", "Cloud Run"],
  },
];

module.exports = {
  testUsers,
  testProjects,
  testSkills,
  testReviews,
  testCertifications,
};
