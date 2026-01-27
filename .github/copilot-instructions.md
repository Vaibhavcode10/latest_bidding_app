# Copilot Instructions for AI Agents

## Project Overview
- This is a sports auction/bidding app with a React frontend and a Node.js/Express backend.
- Data for players, teams, franchises, and auctioneers is stored in JSON files under `data/` (frontend) and `server/data/` (backend).
- The backend exposes REST endpoints for auctioneers, players, and teams (see `server/routes/`).
- Context providers (see `context/`) manage authentication and bidding state in the React app.

## Key Workflows
- **Start locally:**
  1. `npm install`
  2. Set `GEMINI_API_KEY` in `.env.local` (if required)
  3. `npm run dev` (runs Vite dev server)
- **Build for production:**
  - `npm run build` (outputs to `dist/`)
- **Backend:**
  - Node/Express server code is in `server/`. Data is read/written from JSON files.

## Patterns & Conventions
- **Data access:**
  - Use helper functions to load/save JSON (see `server/fileStore.js`).
  - Each sport has its own subfolder in `data/` and `server/data/`.
- **Context:**
  - Use React context for auth and bidding state (`context/AuthContext.tsx`, `context/BiddingRequestContext.tsx`).
- **Routing:**
  - Frontend routes in `pages/` and `pages/dashboard/`.
  - Backend API routes in `server/routes/`.
- **Type safety:**
  - Shared types in `types.ts`.
- **No database:**
  - All persistent data is in JSON files, not a DB.

## Integration Points
- **Frontend <-> Backend:**
  - API calls are made via `services/api.ts`.
  - Endpoints are defined in `server/routes/`.
- **Authentication:**
  - Managed in `context/AuthContext.tsx` and backend login endpoints.

## Examples
- To add a new sport, create a new folder under `data/` and `server/data/` with the required JSON files.
- To add a new API endpoint, add a route in `server/routes/` and update `services/api.ts` if needed.

## Tips for AI Agents
- Always update both frontend and backend data structures when adding new entities.
- Use the context providers for stateful logic in React.
- Follow the file/folder naming conventions for new sports or features.

---
For more, see [README.md](../README.md), [types.ts](../types.ts), and example context/providers in [context/](../context/).
