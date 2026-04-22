const demoUsers = {
  developer: {
    _id: "u1",
    name: "John Developer",
    username: "developer",
    email: "developer@devrank.com",
    role: "developer",
    bio: "Full-stack developer passionate about building practical products with clean interfaces and strong APIs.",
    location: "San Francisco, CA",
    company: "TechCorp",
    github: "https://github.com/johndeveloper",
    linkedin: "https://linkedin.com/in/johndeveloper",
    website: "https://johndeveloper.dev",
    profileScore: 4.2,
    createdAt: "2024-01-15T10:00:00.000Z",
    skills: ["JavaScript", "React", "Node.js", "MongoDB", "TypeScript"],
  },
  reviewer: {
    _id: "u2",
    name: "Sarah Reviewer",
    username: "reviewer",
    email: "reviewer@devrank.com",
    role: "reviewer",
    bio: "Senior software architect and certified reviewer with a focus on product quality and maintainability.",
    location: "New York, NY",
    company: "CodeReview Inc.",
    github: "https://github.com/sarahreviewer",
    linkedin: "https://linkedin.com/in/sarahreviewer",
    website: null,
    profileScore: 4.8,
    createdAt: "2023-06-20T10:00:00.000Z",
    skills: ["JavaScript", "Python", "System Design", "Code Review"],
  },
  admin: {
    _id: "u3",
    name: "Admin User",
    username: "admin",
    email: "admin@devrank.com",
    role: "admin",
    bio: "Platform administrator and moderation lead for DevRank.",
    location: "Remote",
    company: "DevRank",
    github: null,
    linkedin: null,
    website: null,
    profileScore: 5,
    createdAt: "2023-01-01T10:00:00.000Z",
    skills: [],
  },
};

const publicProfiles = {
  developer: {
    ...demoUsers.developer,
    projects: 12,
    reviews: 48,
    wouldHireRate: 92,
  },
  reviewer: {
    ...demoUsers.reviewer,
    projects: 8,
    reviews: 61,
    wouldHireRate: 96,
  },
};

const landingStats = [
  { value: "10,000+", label: "Developers" },
  { value: "25,000+", label: "Projects" },
  { value: "50,000+", label: "Reviews" },
];

const landingFeatures = [
  { title: "Project Showcase", text: "Upload projects with tech stacks, repo links, and structured review history." },
  { title: "Structured Reviews", text: "Capture code quality, clarity, and hireability in a repeatable format." },
  { title: "Certified Reviewers", text: "Show reviewers with verified status and track moderation decisions." },
  { title: "Profile Score", text: "Roll reviews into a visible score that hiring teams can understand quickly." },
  { title: "Skill Matching", text: "Surface developers by skill and experience rather than generic keywords." },
  { title: "Public Profiles", text: "Publish a shareable profile with reviews, skills, and project history." },
];

const landingSteps = [
  { step: "1", title: "Create Your Profile", text: "Register, add skills, and define a public identity." },
  { step: "2", title: "Upload Projects", text: "Add projects with context, tech stack, and review status." },
  { step: "3", title: "Get Reviewed", text: "Certified reviewers score your work and leave actionable notes." },
];

const projects = [
  {
    _id: "p1",
    title: "E-Commerce Platform",
    description: "Full-stack e-commerce solution with React frontend and Node.js backend.",
    techStack: ["React", "Node.js", "MongoDB", "Stripe"],
    status: "reviewed",
    averageRating: 4.5,
    reviewCount: 3,
    owner: demoUsers.developer,
    createdAt: "2024-02-15T10:00:00.000Z",
  },
  {
    _id: "p2",
    title: "Task Management API",
    description: "RESTful API for task management with authentication and real-time updates.",
    techStack: ["Express", "PostgreSQL", "Socket.io", "JWT"],
    status: "seeking-review",
    averageRating: 0,
    reviewCount: 0,
    owner: demoUsers.developer,
    createdAt: "2024-03-01T10:00:00.000Z",
  },
  {
    _id: "p3",
    title: "Weather Dashboard",
    description: "Real-time weather dashboard using OpenWeather API with detailed charts.",
    techStack: ["Vue.js", "Tailwind", "Chart.js"],
    status: "reviewed",
    averageRating: 4.8,
    reviewCount: 2,
    owner: demoUsers.developer,
    createdAt: "2024-01-20T10:00:00.000Z",
  },
];

const reviews = [
  {
    _id: "r1",
    projectId: "p1",
    projectTitle: "E-Commerce Platform",
    reviewer: demoUsers.reviewer,
    overallRating: 5,
    wouldHire: true,
    createdAt: "2024-03-10T10:00:00.000Z",
    note: "Excellent project structure and clear separation of concerns.",
  },
  {
    _id: "r2",
    projectId: "p1",
    projectTitle: "E-Commerce Platform",
    reviewer: {
      name: "Mike Code",
      username: "mike",
    },
    overallRating: 4,
    wouldHire: true,
    createdAt: "2024-03-08T10:00:00.000Z",
    note: "Solid API design with room to tighten validation.",
  },
];

const exploreUsers = [
  {
    _id: "u1",
    name: "John Developer",
    username: "developer",
    bio: "Full stack developer specializing in React and Node.js.",
    rating: 4.8,
    projects: 12,
    skills: ["JavaScript", "React", "Node.js"],
    isReviewer: false,
  },
  {
    _id: "u2",
    name: "Sarah Reviewer",
    username: "reviewer",
    bio: "Senior software engineer and certified code reviewer.",
    rating: 4.9,
    projects: 8,
    skills: ["TypeScript", "Python", "Go"],
    isReviewer: true,
  },
  {
    _id: "u3",
    name: "Mike Builder",
    username: "mike",
    bio: "Frontend developer passionate about UI and product polish.",
    rating: 4.5,
    projects: 6,
    skills: ["Vue.js", "CSS", "Figma"],
    isReviewer: false,
  },
];

const skillCategories = [
  { name: "Language", count: 12 },
  { name: "Framework", count: 8 },
  { name: "Database", count: 4 },
  { name: "Cloud", count: 6 },
];

const skills = [
  {
    _id: "s1",
    name: "JavaScript",
    category: "Language",
    description: "Browser and server-side scripting language used across the platform.",
    users: [demoUsers.developer.name, demoUsers.reviewer.name],
  },
  {
    _id: "s2",
    name: "React",
    category: "Framework",
    description: "Frontend framework used in project showcases and portfolio builds.",
    users: [demoUsers.developer.name],
  },
];

const certifications = [
  {
    _id: "c1",
    title: "Reviewer Certification",
    status: "approved",
    issuer: "DevRank Admin Team",
    date: "2024-02-01",
  },
  {
    _id: "c2",
    title: "Backend Architecture Certificate",
    status: "pending",
    issuer: "CodeReview Inc.",
    date: "2024-03-12",
  },
];

const certificationRequests = [
  {
    _id: "cr1",
    name: "Sarah Reviewer",
    username: "reviewer",
    certificate: "Backend Architecture Certificate",
    submittedAt: "2024-03-20",
    status: "pending",
  },
  {
    _id: "cr2",
    name: "John Developer",
    username: "developer",
    certificate: "Full Stack Certification",
    submittedAt: "2024-03-18",
    status: "approved",
  },
];

const activityLogs = [
  { _id: "l1", action: "User registered", actor: "developer", target: "developer", createdAt: "2024-03-21 09:15" },
  { _id: "l2", action: "Project submitted", actor: "developer", target: "E-Commerce Platform", createdAt: "2024-03-21 11:04" },
  { _id: "l3", action: "Certification approved", actor: "admin", target: "reviewer", createdAt: "2024-03-22 14:30" },
];

const reviewFormScores = ["Code Quality", "Creativity", "Clean Code", "Documentation"];

module.exports = {
  demoUsers,
  publicProfiles,
  landingStats,
  landingFeatures,
  landingSteps,
  projects,
  reviews,
  exploreUsers,
  skillCategories,
  skills,
  certifications,
  certificationRequests,
  activityLogs,
  reviewFormScores,
};