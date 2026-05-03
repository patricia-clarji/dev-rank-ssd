# DevRank
DevRank is an interactive developer platform built with Express.js and EJS that helps developers:
- Showcase projects and technical skills
- Manage and search skills
- Submit, update, and display project reviews
- Apply for certifications and track reviewer activity
- Maintain activity logs for user and project events

**Core app features:**
- User registration, profile updates, and skill management
- Project creation, editing, status workflows, and review collection
- Review creation, updates, and owner-specific review flows
- Skill tagging, search, and admin skill management
- Certification requests, approval flows, and activity logging


## Tech Stack

| Layer         | Technology                |
|-------------- |-------------------------- |
| Language      | JavaScript (Node.js)      |
| Framework     | Express.js                |
| Database      | MongoDB (Mongoose ORM)    |
|               | SQLite (Sequelize ORM)    |
| Documentation | In-app UI and code-driven manuals |
| Testing       | Jest                      |

**App style:** Server-rendered web experience with Express.js and EJS views.

## Setup
1. Clone the repo
2. Run `npm install`
3. Create `.env` with `MONGO_URI` and `PORT`
4. Run `npm run dev`

## Notes
This repository contains a server-rendered developer platform built with Express, EJS views, MongoDB/Mongoose, and SQLite/Sequelize support for activity tracking and admin data.

## Architecture Diagram
https://mermaid.ai/app/projects/5ff21cc6-8239-4558-9929-8f4b686031b0/diagrams/9165de1f-526a-4547-9e8c-473cbb6cc886/share/invite/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkb2N1bWVudElEIjoiOTE2NWRlMWYtNTI2YS00NTQ3LTllOGMtNDczY2JiNmNjODg2IiwiYWNjZXNzIjoiVmlldyIsImlhdCI6MTc3NDAxMTc2Mn0.2g4obtbsVF7gaUW-fAgYt96DW9maUzMAfV5oq__WlrE