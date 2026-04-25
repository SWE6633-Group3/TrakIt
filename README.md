# TrakIt - [Production App](https://trak-it-frontend.onrender.com)

TrakIt is a lightweight project management system that tracks software projects, requirements, risks, and effort. Created as part of a software engineering course project.

See `README.app.md` for details on how to set up and run the app.

Production deployment: https://trak-it-frontend.onrender.com

## Quick Start (Local Development)

### Prerequisites

- Node.js 22.12+ (the backend uses `node:sqlite`)
- npm

### 1. Install dependencies

```bash
pnpm install # We highly recommend“pnpm”, this can solve the npm hell dependency checking problem
```

If your machine uses a mirror registry and install fails with a package `404`, use:

```bash
npm install --registry=https://registry.npmjs.org
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and adjust values if needed:

```bash
cp .env.example .env
```

Default backend settings:

```env
PORT=3001
SQLITE_DB=trackit.db
```

Optional frontend override in `.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://localhost:3001
```

### 3. Start the project

```bash
npm run start-dev
```

- Frontend: `http://localhost:3000`
- Production frontend: `https://trak-it-frontend.onrender.com`
- Backend: `http://localhost:3001`
- Health check: `http://localhost:3001/api/health`

### Common startup checks

- If you see `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`, your Node process is missing the `--experimental-sqlite` flag or is using an older Node version. The provided npm scripts already add the required flag.
- If `concurrently: command not found`, re-run `npm install`.
- If ports are occupied, stop the conflicting process or change ports in `.env`.

## Team Information

**Team Name:** Group 3  
**Public Git Repository:** https://github.com/SWE6633-Group3/TrakIt  
**Public Atlassian:** [Confluence URL]

### Team Roster

| Name | Role |
| ---- | ---- |
| Aaliyah McElrath | Group Leader |
| Yukang Shen | Developer |
| Louis Muhammad | Developer |
| Anthony Ngyuen | Developer |
| Matthew Maravilla | Developer |
| Joseph Pentecost | Developer |

### Deliverables
**Important Notes**
- Each team must designate a team leader responsible for the overall development process and submitting deliverables.
- All submissions are team-based. Only the team leader submits on behalf of the team.
- Break the project into responsibilities so each member contributes.
- Grading is team-based, but non-contributing members may receive different grades.
- The expectation is a minimum working prototype, not a fully functional product.

**Deliverable 1 (Project Plan)**  
Due: 3/22/2026  
Location: `Deliverable1/` (add files and links here)

**Deliverable 2 (Project Product)**  
Due: 4/26/2026  
Location: `Deliverable2/` (add files and links here)

## Atlassian Tools Integration

To streamline collaboration and project management, we use Atlassian tools for documentation and backlog tracking. Below are the relevant links:


### Jira

[Kanban Board]([https://swe6633-group3.atlassian.net/jira/software/projects/TGP/boards/35])

[Burndown Chart]([https://swe6633-group3.atlassian.net/jira/software/projects/TGP/boards/35/reports/burndown?source=overview])

[Backlog]([https://swe6633-group3.atlassian.net/jira/software/projects/TGP/boards/35/backlog?epics=visible])

## Collaboration Setup

- **Communication Channel:** [Channel and tools]
- **Meeting Schedule:** [Stand-ups, planning, retrospectives]
- **geekbot:** Sends daily standup reminders and tracks responses from all team members.

## Branch Strategy

- `main`: stable, reviewed code only.
- `dev`: optional integration branch (only used if the team explicitly decides to adopt it).
- `feature/<short-name>`: new features (one feature per branch).
- `bugfix/<short-name>`: non-urgent fixes.
- `hotfix/<short-name>`: urgent fixes targeting `main`.
- PRs required for merging into `main` (and `dev` if used).
- At least one PR review approval is required before merge.
- Lint must pass before merge (GitHub Action: `Lint`).
- Delete branches after merge to keep the repo clean.

## Contributors

- Aaliyah McElrath
- Yukang Shen
- Louis Muhammad
- Anthony Ngyuen
- Matthew Maravilla
- Joseph Pentecost
