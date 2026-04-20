# Digital Ikimina

Digital Ikimina is a small full-stack demo app built with **Node.js** and **React**.

It helps you manage **Ikimina groups**: authentication, dashboard KPIs, groups, members, rotation order, contributions status, and payout schedule.

## Tech stack

- **Backend**: Node.js + Express (simple in-memory store)
- **Frontend**: React 18 + React Router (CDN, no build tooling required)

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm run dev
   ```

3. Open the app in your browser:

   ```text
   http://localhost:3000
   ```

## Project structure

- `server.js` - Express server exposing auth/groups APIs and serving the static frontend
- `public/index.html` - HTML shell that bootstraps the React app
- `public/app.jsx` - React UI logic
- `public/styles.css` - UI styling

> Notes: data is stored in memory only and will reset whenever the server restarts.

