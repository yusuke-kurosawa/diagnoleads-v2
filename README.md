# DiagnoLeads v2

AI-Powered B2B Diagnostic Platform built with Next.js 15.

## Quick Start

```bash
# Install dependencies
npm install

# Start Docker services
docker-compose up -d

# Run development server
npm run dev
```

Visit http://localhost:3000

## Tech Stack

- **Framework**: Next.js 15 + React 19
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS 4.0
- **Database**: PostgreSQL + Drizzle ORM
- **API**: tRPC + Server Actions
- **State Management**: Zustand + nuqs
- **Testing**: Vitest + Playwright
- **Code Quality**: Biome + lefthook
- **Package Manager**: npm (via Node.js 20.11.0)

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm start               # Start production server

# Code Quality
npm run lint            # Run Biome linter
npm run format          # Format code with Biome
npm run typecheck       # TypeScript type checking

# Testing
npm test               # Run unit tests (Vitest)
npm run test:e2e        # Run E2E tests (Playwright)

# Database
npm run db:generate     # Generate Drizzle migrations
npm run db:migrate      # Run migrations
npm run db:studio       # Open Drizzle Studio GUI
```

## Development Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Next.js App | http://localhost:3000 | - |
| PgAdmin | http://localhost:5050 | admin@diagnoleads.local / admin |
| Mailhog | http://localhost:8025 | - |
| Drizzle Studio | http://localhost:4983 | Run `npm run db:studio` |

## Project Structure

```
diagnoleads-v2/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (marketing)/       # Marketing pages
│   ├── (app)/             # Main application
│   ├── api/               # API routes
│   └── actions/           # Server Actions
├── components/            # React components
│   ├── ui/               # UI components (shadcn/ui)
│   └── features/         # Feature components
├── lib/                   # Utilities & configs
│   ├── db/               # Database schema & client
│   ├── validation/       # Zod schemas
│   ├── types/            # TypeScript types
│   └── utils/            # Helper functions
├── server/                # tRPC server
│   └── routers/          # API routers
├── test/                  # Tests
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # E2E tests
└── public/                # Static assets
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/diagnoleads_dev"
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Setup Documentation

For detailed setup instructions, see [docs/v2-setup/](./docs/v2-setup/):
- `QUICK_START.md` - Quick 15-minute setup guide
- `SETUP_GUIDE.md` - Comprehensive setup documentation
- `setup.sh` - Automated setup script

## Git Workflow

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with automatic validation:

```bash
# Commit format
<type>(<scope>): <description>

# Examples
feat(auth): add user authentication
fix(db): resolve connection pooling issue
docs(readme): update setup instructions
```

**Available scopes**: auth, leads, assessments, analytics, ai, db, api, ui, embed, integrations, email, jobs, i18n, seo, ci, deps, config, docs, test

## License

Proprietary - DiagnoLeads Team
