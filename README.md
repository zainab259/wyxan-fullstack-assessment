# The Small Web

## Requirements

Node.js 20.9+, npm 10+, and a MongoDB Atlas database.

## Configuration

Set `MONGODB_URI` in `backend/.env` to the Atlas URI for `wyxan_browser`. Replace `<DB_PASSWORD>` in that file with your password privately (URL-encode reserved characters). The URI is used by the backend only. Set `FRONTEND_ORIGIN=http://localhost:3000` and `PORT=8000` as needed. In `frontend/.env.local`, set `NEXT_PUBLIC_API_URL=http://localhost:8000/api`.

## Run

```sh
npm install
npm run seed
npm run dev
```

To run the sides in separate terminals instead, use `npm run dev:backend` and `npm run dev:frontend`.

Frontend: http://localhost:3000. Backend API and health: http://localhost:8000/api and http://localhost:8000/api/health.

## Checks

```sh
npm test
npm run lint
npm run build
```

The seed is deterministic and upserts only its own stable user/site/visit IDs. Duplicate published addresses are rejected with HTTP 409. Browsing history is per selected person; no accounts or authentication are used.

## Walkthrough outline (4–5 minutes)

Introduce the app and its three MongoDB collections; browse four linked pages; use Back, Forward, then branch to show forward history being discarded and snapshots restored; search body prose and return to results; publish a page and open it; show a missing address; explain iframe sandbox/CSP limits. There is no authentication, roles, hosted assets, external browsing, tabs, bookmarks, downloads, or real internet access.
