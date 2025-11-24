# DiagnoLeads v2

AI-Powered B2B Diagnostic Platform for **Holdings, Group Companies & Enterprise Organizations**

> 🏢 **Our Core Competence**: Not just another multi-tenant SaaS.
> DiagnoLeads v2 is designed from the ground up to support **holding companies**, **corporate groups**, and **M&A scenarios** with hierarchical organization structures and cross-organizational insights.

## 🎯 What Makes Us Different

| Standard Multi-Tenant SaaS | DiagnoLeads v2 |
|---------------------------|----------------|
| ✅ Organization-level data isolation | ✅ Organization-level data isolation |
| ❌ Flat organization structure only | ✅ **Hierarchical organizations** (parent-subsidiary) |
| ❌ No cross-org collaboration | ✅ **Group-wide reporting & analytics** |
| ❌ Manual handling of M&A | ✅ **Built-in M&A support** with data migration |
| ❌ Single-org reports only | ✅ **Consolidated group dashboards** |

**Perfect for**:
- 🏢 Holding companies managing multiple subsidiaries
- 🌐 Corporate groups with complex structures
- 📈 Companies executing M&A strategies
- 🏗️ Enterprises with divisional/company systems

👉 **[Read our Multi-Tenant Strategy](./docs/MULTI_TENANT_STRATEGY.md)** for detailed architecture

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
│       └── leads/        # Lead management components
├── hooks/                 # 🆕 React hooks
│   ├── use-leads.ts      # Lead data hooks
│   └── use-organization.ts # Organization context
├── lib/                   # Utilities & configs
│   ├── db/               # Database schema & client
│   ├── multi-tenant/     # 🆕 Multi-tenant logic
│   │   ├── middleware/   # Organization middleware
│   │   ├── helpers/      # Membership helpers
│   │   └── types.ts      # Multi-tenant types
│   ├── features/         # 🆕 Feature-based modules
│   │   └── leads/        # Lead management
│   │       ├── api/      # tRPC router
│   │       └── types/    # Schemas & types
│   ├── trpc/             # tRPC configuration
│   ├── validation/       # Zod schemas
│   ├── types/            # TypeScript types
│   └── utils/            # Helper functions
├── server/                # tRPC server
│   └── routers/          # API routers
├── docs/                  # 📚 Documentation
│   ├── MULTI_TENANT_STRATEGY.md  # 🆕 Holdings/Group strategy
│   └── DIRECTORY_IMPROVEMENT_PLAN.md
├── openspec/              # 📋 OpenSpec-driven development
│   ├── specs/            # Architecture specs (Source of Truth)
│   └── changes/          # Change proposals
├── test/                  # Tests
│   ├── unit/             # Unit tests
│   │   ├── trpc/         # tRPC middleware tests
│   │   └── features/     # Feature tests
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
