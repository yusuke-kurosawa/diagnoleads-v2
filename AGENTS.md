# DiagnoLeads v2 - Agent Instructions

## Project Overview

DiagnoLeads v2 is an enterprise-grade diagnostic lead management platform built with Next.js 15, featuring AI-powered lead scoring, multi-tenant support, and holdings/group company hierarchy management.

---

## Core Commands

```bash
# Development
bun run dev              # Start development server
bun run build            # Build for production
bun run lint             # Run Biome linter
bun run typecheck        # TypeScript type checking

# Testing
bun run test             # Run unit tests (Vitest)
bun run test:coverage    # Run with coverage
bun run test:e2e         # Run E2E tests (Playwright)

# Database
bun run db:push          # Push schema changes
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio

# Docker
docker compose up -d     # Start local services (PostgreSQL, Redis, Mailhog)
docker compose down      # Stop services
```

---

## Project Layout

```
diagnoleads-v2/
├── app/                    # Next.js App Router
│   ├── [locale]/          # i18n routes (ja, en)
│   │   ├── (dashboard)/   # Authenticated dashboard pages
│   │   ├── (public)/      # Public pages (landing, diagnostic)
│   │   └── (auth)/        # Auth pages (login, signup)
│   ├── api/               # API routes
│   └── (payload)/         # PayloadCMS admin
├── lib/
│   ├── features/          # Feature modules (leads, ai, webhooks, etc.)
│   ├── db/                # Drizzle ORM schema and client
│   ├── auth/              # Better Auth configuration
│   └── cms/               # CMS abstraction layer
├── components/            # React components
├── test/
│   ├── unit/              # Vitest unit tests
│   └── e2e/               # Playwright E2E tests
├── docs/                  # Documentation
│   ├── FEATURES.md        # Feature list
│   ├── FEATURE_MATRIX.md  # Feature matrix with test coverage
│   └── ROADMAP.md         # Prioritized task roadmap
└── locales/               # i18n translation files (ja, en)
```

---

## Development Patterns & Constraints

### Architecture
- **tRPC v11** for type-safe APIs
- **Drizzle ORM** for database operations
- **Better Auth** for authentication
- **CASL** for authorization
- **PayloadCMS 3.66** for content management

### Code Style
- Use **Biome** for linting and formatting
- Follow existing patterns in the codebase
- All UI text must support i18n (ja/en)
- Use TailAdmin components for dashboard UI

### Testing
- Unit tests: `test/unit/features/{feature}.test.ts`
- E2E tests: `test/e2e/{feature}.spec.ts`
- Mock external services (Anthropic, OpenAI, Resend)
- Target: 70%+ unit test coverage

### Security
- Row-Level Security (RLS) for data isolation
- CSRF protection on all forms
- Rate limiting on public APIs
- Never commit secrets or API keys

---

## Git Workflow Essentials

```bash
# Before committing
git status               # Check changes
git diff                 # Review changes

# Commit format
git commit -m "type(scope): description"

# Types: feat, fix, docs, test, refactor, chore
# Example: feat(leads): add bulk export functionality
```

### Branch Strategy
- `main` - Production-ready code
- Feature branches: `feat/feature-name`
- Bug fixes: `fix/bug-description`

---

## Evidence Required for Every PR

1. **Tests pass**: `bun run test` shows all green
2. **Type check**: `bun run typecheck` has no errors
3. **Lint**: `bun run lint` has no errors
4. **Documentation**: Update docs if API changes

---

## Current Sprint Focus

### P0: Pre-Release (Must Complete)
1. E2E test environment setup
2. Diagnostic form submission tests
3. Production environment variables
4. Security audit

### P1: Post-Release Week 1
1. AI feature tests with mocks
2. External integration tests
3. REST API v2 tests
4. Performance optimization

See `docs/ROADMAP.md` for full task breakdown.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `IMPLEMENTATION_CHECKLIST.md` | Implementation progress tracking |
| `docs/FEATURE_MATRIX.md` | Feature matrix with test coverage |
| `docs/ROADMAP.md` | Prioritized task list |
| `vitest.config.ts` | Unit test configuration |
| `playwright.config.ts` | E2E test configuration |
| `drizzle.config.ts` | Database configuration |

---

## Contact & Resources

- Tech Stack: Next.js 15, React 19, TypeScript 5.9, Tailwind CSS v4
- Database: PostgreSQL 16 with pgvector
- AI: Anthropic Claude 4.5 Sonnet, OpenAI Embeddings
- Deployment: Vercel
