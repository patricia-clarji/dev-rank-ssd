require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/mongo/User");
const connectMongoDB = require("../config/mongodb.js");

const seedUsers = async () => {
  try {
    await connectMongoDB();
    
    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Create test users
    const users = [
      {
        username: "developer",
        name: "John Developer",
        email: "developer@devrank.com",
        password: "password123",
        role: "developer",
        bio: "Full-stack developer passionate about building practical products with clean interfaces and strong APIs.",
        githubUrl: "https://github.com/johndeveloper",
      },
      {
        username: "reviewer",
        name: "Sarah Reviewer",
        email: "reviewer@devrank.com",
        password: "password123",
        role: "reviewer",
        bio: "Senior software architect and certified reviewer with a focus on product quality and maintainability.",
        githubUrl: "https://github.com/sarahreviewer",
      },
      {
        username: "admin",
        name: "Admin User",
        email: "admin@devrank.com",
        password: "admin123",
        role: "admin",
        bio: "Platform administrator and moderation lead for DevRank.",
        githubUrl: null,
      },
    ];

    const createdUsers = [];
    
    for (const userData of users) {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      const user = await User.create({
        username: userData.username,
        name: userData.name,
        email: userData.email,
        passwordHash,
        role: userData.role,
        bio: userData.bio,
        githubUrl: userData.githubUrl,
        profileScore: 4.5,
        joinedAt: new Date(),
      });
      
      createdUsers.push({
        name: user.name,
        email: user.email,
        id: user._id.toString(),
      });
      
      console.log(`✓ Created user: ${user.name} (${user.email})`);
    }

    console.log("\n=== Test Users Created ===");
    createdUsers.forEach(user => {
      console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });
    
    console.log("\n=== Login Credentials ===");
    console.log("Developer: developer@devrank.com / password123");
    console.log("Reviewer: reviewer@devrank.com / password123");
    console.log("Admin: admin@devrank.com / admin123");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedUsers();
}
