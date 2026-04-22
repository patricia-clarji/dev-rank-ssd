require("dotenv").config();
const mongoose = require("mongoose");
const Skill = require("../models/mongo/Skill");

const presetSkills = [
  // Frontend
  { name: "HTML", category: ["frontend"], isPreset: true },
  { name: "CSS", category: ["frontend"], isPreset: true },
  { name: "JavaScript", category: ["frontend", "backend"], isPreset: true },
  { name: "TypeScript", category: ["frontend", "backend"], isPreset: true },
  { name: "React", category: ["frontend"], isPreset: true },
  { name: "Vue.js", category: ["frontend"], isPreset: true },
  { name: "Angular", category: ["frontend"], isPreset: true },
  { name: "Next.js", category: ["frontend", "backend"], isPreset: true },
  { name: "Tailwind CSS", category: ["frontend"], isPreset: true },

  // Backend
  { name: "Node.js", category: ["backend"], isPreset: true },
  { name: "Express.js", category: ["backend"], isPreset: true },
  { name: "Python", category: ["backend"], isPreset: true },
  { name: "Django", category: ["backend"], isPreset: true },
  { name: "FastAPI", category: ["backend"], isPreset: true },
  { name: "Java", category: ["backend"], isPreset: true },
  { name: "Spring Boot", category: ["backend"], isPreset: true },
  { name: "C#", category: ["backend"], isPreset: true },
  { name: ".NET", category: ["backend"], isPreset: true },
  { name: "Go", category: ["backend"], isPreset: true },
  { name: "Rust", category: ["backend"], isPreset: true },
  { name: "PHP", category: ["backend"], isPreset: true },
  { name: "Laravel", category: ["backend"], isPreset: true },

  // Database
  { name: "MongoDB", category: ["database"], isPreset: true },
  { name: "PostgreSQL", category: ["database"], isPreset: true },
  { name: "MySQL", category: ["database"], isPreset: true },
  { name: "SQLite", category: ["database"], isPreset: true },
  { name: "Redis", category: ["database", "backend"], isPreset: true },
  { name: "Elasticsearch", category: ["database", "backend"], isPreset: true },

  // DevOps
  { name: "Docker", category: ["devops"], isPreset: true },
  { name: "Kubernetes", category: ["devops"], isPreset: true },
  { name: "GitHub Actions", category: ["devops"], isPreset: true },
  { name: "AWS", category: ["devops"], isPreset: true },
  { name: "Azure", category: ["devops"], isPreset: true },
  { name: "GCP", category: ["devops"], isPreset: true },
  { name: "Linux", category: ["devops"], isPreset: true },
  { name: "Nginx", category: ["devops", "backend"], isPreset: true },

  // Mobile
  { name: "React Native", category: ["mobile", "frontend"], isPreset: true },
  { name: "Flutter", category: ["mobile"], isPreset: true },
  { name: "Swift", category: ["mobile"], isPreset: true },
  { name: "Kotlin", category: ["mobile"], isPreset: true },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    let inserted = 0;
    for (const skill of presetSkills) {
      const exists = await Skill.findOne({ name: skill.name });
      if (!exists) {
        await Skill.create(skill);
        inserted++;
      }
    }

    console.log(`Seeding complete. ${inserted} new preset skills inserted (${presetSkills.length - inserted} already existed).`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
};

seed();
