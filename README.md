# TrakIt - [Link](http://example.com)

TrakIt is a lightweight project management system that tracks software projects, requirements, risks, and effort. Created as part of a software engineering course project.

See `README.app.md` for details on how to set up and run the app.

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

## Contributors

- Aaliyah McElrath
- Yukang Shen
- Louis Muhammad
- Anthony Ngyuen
- Matthew Maravilla
- Joseph Pentecost


## Prerequisites

- Node.js 18 or later (LTS recommended)
- npm (bundled with Node.js). You can also use yarn or pnpm if you prefer.

Verify installation:

```bash
node -v
npm -v
```

## Install

1. Open a terminal and change into the project folder:

2. Install dependencies:

```bash
npm install
```

If you use yarn:

```bash
yarn install
```

Or pnpm:

```bash
pnpm install
```

## Available scripts (from package.json)

This project includes the following npm scripts. Run them from the project root.

- `npm run dev` — Start the Next.js development server (default: http://localhost:3000).
- `npm run build` — Build the app for production (runs Next.js build).
- `npm start` — Start the production server after building the app.
- `npm run lint` — Run ESLint.

Examples:

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm start

# Run linter
npm run lint
```

## TypeScript and Tailwind

- This project is configured to use TypeScript. tsconfig.json is present in the repo.
- Tailwind CSS and PostCSS are configured (see `tailwind.config` and `postcss.config.mjs` files in the repo).

No additional setup is required to use TypeScript or Tailwind beyond installing dependencies.

## Environment variables

If your app requires environment variables, create a `.env.local` file in the project root. Example:

```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
```

Next.js automatically loads `.env.local` during development.

## Troubleshooting

If you run into problems:

- Remove existing node modules and lockfile then reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

- Clear Next.js cache by removing `.next` then rebuild:

```bash
rm -rf .next
npm run build
```

- Ensure Node.js version meets the prerequisite.

## Contributing

Pull requests and issues are welcome. Keep changes small and include tests or steps to reproduce when relevant.

## License

This repository does not specify a license. Add a LICENSE file if you intend to publish or share the project with an open-source license.
