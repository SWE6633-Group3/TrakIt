## Prerequisites

- Node.js 22.12 or later
- npm (bundled with Node.js). You can also use yarn or pnpm if you prefer.

Verify installation:

```bash
node -v
npm -v
```

## Install

1. Open a terminal and change into the project folder.
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
- `npm run server` — Start the backend server (http://localhost:3001) with nodemon + tsx.
- `npm run seed` — Seed the SQLite database with sample data.
- `npm run start-dev` — Start the app (http://localhost:3000) and the server (http://localhost:3001).

Examples:

```bash
# Start development server
npm run dev

# Start backend server
npm run server

# Seed the database
npm run seed

# Start app and server together
npm run start-dev
```

## TypeScript and Tailwind

- This project is configured to use TypeScript. `tsconfig.json` is present in the repo.
- Tailwind CSS and PostCSS are configured (see `tailwind.config.ts` and `postcss.config.mjs` files in the repo).

## Environment variables

Create a `.env` file in the project root for backend settings:

```env
PORT=3001
SQLITE_DB=trackit.db
```

Create a `.env.local` file in the project root for frontend settings if you want to override the default API base:

```env
NEXT_PUBLIC_API_BASE=http://localhost:3001
```

## Backend setup

The backend runs as a separate Express server on port 3001 and uses Node's built-in experimental SQLite module as the data store. The npm scripts in this repo already start Node with `--experimental-sqlite`.

1. Start the backend:
   ```bash
   npm run server
   ```
2. Verify health:
   ```bash
   curl http://localhost:3001/api/health
   ```

## Seeding data

Seed the database (this will delete existing data and insert fresh records):

```bash
npm run seed
```

The seed script creates:
- Users (including the class roster + 5 mock users)
- 4 projects with detailed descriptions
- Requirements, risks, and project users (lead + members)

## Contributing

Pull requests and issues are welcome. Keep changes small and include tests or steps to reproduce when relevant.

## License

This repository does not specify a license. Add a LICENSE file if you intend to publish or share the project with an open-source license.
