# FinWise (React)

The FinWise front end, converted from plain HTML/CSS/JS to React (Vite). Look, copy and behaviour are the same as the original; the stylesheet is unchanged.

## Run it

This project has two parts: the React app (this folder) and the API in `server/` (Node, Express, Neon PostgreSQL). Full steps and the API list are in `server/README.md`. In short:

```bash
cd server && cp .env.example .env          # add your Neon connection strings + JWT_SECRET, then:
npm install && npm run dev                 # API on :4000
# new terminal, project root:
npm install && npm run dev                 # app on http://localhost:5173
```

`npm run build` makes the production build in `dist/`. In production the server serves `dist/` and the API from one origin.

## Deploy (Render + Neon)

`render.yaml` is a Render Blueprint for one web service that serves the app and the API. On Render choose New > Blueprint, pick this repo, paste the two Neon connection strings when asked (pooled into `DATABASE_URL`, direct into `DATABASE_URL_UNPOOLED`) and apply. `JWT_SECRET` is generated for you. Optional extras (`GEMINI_API_KEY`, `CLIENT_ORIGIN`) are added later in the service's Environment tab. More in `server/README.md`.

## Routes

| URL | Page |
|---|---|
| `/` | Landing page (3D globe, tour, simulator, FAQ) |
| `/login`, `/signup` | Sign-in screens |
| `/app/:view` | Workspace: `overview`, `scenarios`, `commitments`, `goals`, `transactions`, `budgets`, `subscriptions`, `analytics`, `ai`, `profile`, `settings` |

Every workspace view now has its own URL, so links and the back button work.

## Structure

```
server/                      Express + PostgreSQL API (migrations/, src/routes, src/services)
src/
  main.jsx, App.jsx          entry + routes
  finwise.css                the original stylesheet
  lib/                       no React in here
    api.js                   fetch wrapper (cookies, error handling)
    auth.js                  sign in / up / out
    currency.js              currencies, live rates, formatting
    finance.js               calculations (room, analytics, AI payload)
    exporters.js, celebrate.js
  services/ai.js             AI analysis calls
  context/
    WorkspaceContext.jsx     loads the workspace from the API + every action
    UIContext.jsx            toast + promise dialogs (confirm/alert/forms)
  hooks/                     account actions, landing motion, smooth scroll
  components/                ui/ (Dialog, ProfileMenu, bits), charts/, landing/
  pages/                     Landing, Auth, app/ (AppShell, Onboarding, one file per view)
```

three.js and Lenis are npm packages; three.js loads lazily so the landing page paints first.

## Small fixes made during conversion

- "Entries" and "Active items" counts were shown as money (`$3`); they now show plain numbers.
- AI analysis "No analysis returned" message can now actually appear (it never could before).
- Currency symbols in labels come from state instead of text replacement after render.

Carried over unchanged: negative months in the bar charts are drawn like positive ones (the original did the same).

