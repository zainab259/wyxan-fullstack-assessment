# Assessment verification checklist

| Requirement | Implementation | Verification | Status |
|---|---|---|---|
| Read original assessment and honor scope | `Downloads/Wyxan-FullStack-Technical-Assessment.html`; README | Entire document reviewed before implementation | Pass |
| Next.js 16 App Router, React 19, TypeScript, Tailwind | `frontend/` | Frontend TypeScript check, ESLint 10, and production build | Pass |
| NestJS REST API, strict TypeScript, Mongoose | `backend/src/` | Backend TypeScript check and production build | Pass |
| Private Atlas configuration and credential isolation | `backend/.env`, `.env.example`, `backend/src/app.module.ts`, `.gitignore` | Private configuration connects locally; credential files remain ignored by Git; frontend config contains only API URL | Pass |
| Health endpoint | `backend/src/health/health.module.ts` | Live `GET /api/health` returned HTTP 200 with database connected | Pass |
| Address bar and missing pages | `frontend/app/page.tsx`, `backend/src/config/address.ts` | Address unit tests and live `nature.zz` API request pass; missing-address UI walkthrough remains | Partial: manual browser check pending |
| Internal links and broken links | `frontend/lib/frame.ts`, `frontend/app/page.tsx` | CSP/link-bridge unit test passes; live click path not browser-automated | Partial: manual browser check pending |
| Back/Forward, forward branch removal, per-person stacks | `frontend/lib/navigation.ts`, `frontend/app/page.tsx` | Navigation unit tests cover a four-page trail, branch loss, per-person stacks, missing page, snapshots, search return, and duplicate current entry | Pass for navigation model; manual browser interaction pending |
| Restore prior page snapshots | `frontend/lib/navigation.ts` | Snapshot retention unit test passes; edit-after-return scenario still needs the narrated browser walkthrough | Partial |
| Persistent per-user history | `backend/src/visits/`, `frontend/app/page.tsx` | Service tests pass; live API returned seeded histories of 13, 8, 7, and 7 visits for the four readers | Pass for seeded retrieval; manual navigation walkthrough pending |
| Full-content search and snippets | `backend/src/sites/sites.service.ts`, `backend/src/config/address.ts` | Service tests pass; live search for `tide pools` returned `nature.zz` | Pass for API/service behavior; result-navigation walkthrough pending |
| Publish and duplicate policy | `backend/src/sites/`, frontend Publish panel | Service tests cover searchable text and duplicate conflict; live publishing was not exercised | Partial: manual browser check pending |
| Sandboxed HTML/CSP | `frontend/lib/frame.ts`, iframe in `frontend/app/page.tsx` | Tests cover scripts, handlers policy, external resources, refresh, and fictional link bridge | Pass for document policy; real browser exploit testing pending |
| Deterministic sample seed | `backend/scripts/seed.ts` | Seed ran twice; each run reported 4 users, 10 sites, and 35 deterministic visits | Pass |
| Automated tests | `backend/src/**/*.spec.ts`, `frontend/lib/*.test.ts` | `npm test`: 23 tests pass, including ObjectId reference schema checks | Pass |
| ESLint | workspace configs | `npm run lint` passes | Pass |
| Production builds | both workspaces | `npm run build` succeeded | Pass |
| Git incremental history and secret exclusion | project `.git/`, `.gitignore` | 11 local incremental commits; `.env` excluded; no public GitHub remote configured | Partial: create public remote and push |
| README and narrated demo plan | `README.md`, `DEMO-SCRIPT.md` | Commands and 4–5 minute script reviewed | Pass |

## Remaining verification

The local Atlas connection, seed, health endpoint, readers, sites, search, and seeded histories are verified. Still manually walk the UI flows (four-page trail, Back/Forward and branch loss, search and return, publishing, and a missing address), record the narrated 4–5 minute walkthrough, create a public GitHub remote and push the incremental commits, then email both links before the deadline with Haroon in CC. The backend credentials remain private; reviewers need their own `backend/.env` and Atlas access to run the app.

## Local commits

- `5fe3ca1` — NestJS API, MongoDB schemas, and deterministic seed
- `8580b57` — browser interface and isolated page viewer
- `e5264bb` — supported Next.js baseline and flat ESLint configuration
- `c2cb4bf` — per-user snapshots and HTML isolation fixes
- `86949f4` — tests and walkthrough documentation
- `449306d` — history isolation and deterministic seed identifier coverage
- `fcfb6d8` — stable fixture identifiers for sites and visits
