# Ikimina – Digital Savings Group Management System

React + Node.js/Express + MongoDB + JWT stack for managing savings groups (Ikimina): create/join groups, assign rotation, track contributions, detect late payments, and view dashboard (total contributed, next payout member, remaining cycles).

## Prerequisites

- **Node.js** (v18+)
- **MongoDB** running locally (e.g. `mongodb://localhost:27017`) or set `MONGO_URI` in server `.env`

## Quick start

### 1. Backend

```bash
cd server
cp .env.example .env   # edit .env if needed (MONGO_URI, JWT_SECRET)
npm install
npm start
```

API runs at `http://localhost:5000`. Health: `GET /health`.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at `http://localhost:3000` and proxies `/api` to the backend.

### 3. Root scripts (from project root)

- `npm run server` – start backend
- `npm run client` – start frontend dev server
- `npm run client:build` – build frontend for production

## Features

- **Auth**: Register, login, JWT (token in `localStorage`)
- **Groups**: Create group, join by group ID, list my groups
- **Rotation**: Members get a rotation position; owner can update positions (PATCH)
- **Contributions**: Record monthly contribution (POST); late payments detected by due date
- **Dashboard** (per group): Total contributed, next payout member, remaining cycles, late payments list, members

## API overview

- `POST /api/auth/register` – body: `{ name, email, password }`
- `POST /api/auth/login` – body: `{ email, password }`
- `GET /api/auth/me` – Bearer token
- `GET /api/groups` – my groups (Bearer)
- `POST /api/groups` – create group (Bearer)
- `GET /api/groups/:groupId` – group detail (Bearer)
- `POST /api/groups/:groupId/join` – join group (Bearer)
- `PATCH /api/groups/:groupId/memberships/:membershipId/rotation` – body: `{ rotationPosition }` (owner only)
- `POST /api/groups/:groupId/contributions` – body: `{ amount?, month, year }` (Bearer)
- `GET /api/groups/:groupId/dashboard` – dashboard data (Bearer)
