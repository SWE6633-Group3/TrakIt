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
- `npm run start-dev` — Start the development server for both the app (http://localhost:3000) and the server (http://localhost:3001)

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

# Start app and server development servers
npm run start-dev
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
