# Ikimina Management System (Backend)

## Setup

1. Ensure MongoDB is running locally (default): `mongodb://localhost:27017`
2. Copy `.env.example` to `.env` and set values as needed.

## Run

- `npm install`
- `npm run dev` (if nodemon works on your machine) or `npm start`

## API

Base URL: `/api`

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token)

### Groups

- `POST /groups` (create) (Bearer token)
- `POST /groups/:groupId/join` (Bearer token)
- `PATCH /groups/:groupId/memberships/:membershipId/rotation` (owner only) (Bearer token)
- `POST /groups/:groupId/contributions` (Bearer token)
- `GET /groups/:groupId/dashboard` (Bearer token)

