# DevRank API
DevRank is a platform for developers to:
- Showcase projects and technical skills
- Earn certifications and badges
- Build a professional network through code reviews
- Get peer-reviewed, verifiable public profiles for hiring

**Main resources:**
- Users: register, update, follow, manage skills, earn badges
- Projects: create, update, review, search
- Reviews: submit, update, and view project reviews
- Skills & Badges: add, update, and search
- Certifications: apply, approve, and manage
- Activity Logs: track user and project actions


## Tech Stack

| Layer         | Technology                |
|-------------- |-------------------------- |
| Language      | JavaScript (Node.js)      |
| Framework     | Express.js                |
| Database      | MongoDB (Mongoose ORM)    |
|               | SQLite (Sequelize ORM)    |
| API Spec      | OpenAPI 3.0 (YAML)        |
| Testing       | Jest                      |
| Docs          | Swagger UI / Redoc        |

**API style:** RESTful, with detailed OpenAPI documentation for all endpoints and request/response formats.

## Setup
1. Clone the repo
2. Run `npm install`
3. Create `.env` with `MONGO_URI` and `PORT`
4. Run `npm run dev`

## API Documentation
See the full OpenAPI docs in [docs/openapi.yaml](docs/openapi.yaml) for all endpoints, request/response formats, and usage details. You can use tools like Swagger UI or Redoc to visualize and interact with the API.

## Architecture Diagram
https://mermaid.ai/app/projects/5ff21cc6-8239-4558-9929-8f4b686031b0/diagrams/9165de1f-526a-4547-9e8c-473cbb6cc886/share/invite/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkb2N1bWVudElEIjoiOTE2NWRlMWYtNTI2YS00NTQ3LTllOGMtNDczY2JiNmNjODg2IiwiYWNjZXNzIjoiVmlldyIsImlhdCI6MTc3NDAxMTc2Mn0.2g4obtbsVF7gaUW-fAgYt96DW9maUzMAfV5oq__WlrE