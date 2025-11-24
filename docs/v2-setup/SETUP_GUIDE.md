# DiagnoLeads v2 - Complete Setup Guide

**Version**: 1.0
**Date**: 2025-11-23
**Estimated Time**: 30-45 minutes

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] **GitHub Account** with repository creation permissions
- [ ] **Git** installed (`git --version`)
- [ ] **curl** or **wget** for downloading mise
- [ ] **Docker Desktop** installed and running
- [ ] **GitHub CLI** (optional, recommended): `gh --version`

---

## 🚀 Step 1: Create GitHub Repository

### Option A: Using GitHub CLI (Recommended)

```bash
# 1. Create repository
gh repo create diagnoleads-v2 \
  --private \
  --description "DiagnoLeads v2 - Next.js 15 Full-Stack Diagnostic Platform" \
  --gitignore Node \
  --license MIT

# 2. Clone repository
gh repo clone your-org/diagnoleads-v2
cd diagnoleads-v2
```

### Option B: Using GitHub Web Interface

1. Go to https://github.com/new
2. **Repository name**: `diagnoleads-v2`
3. **Description**: `DiagnoLeads v2 - Next.js 15 Full-Stack Diagnostic Platform`
4. **Visibility**: Private (recommended for now)
5. **Initialize**:
   - ✅ Add a README file
   - ✅ Add .gitignore (Node template)
   - ✅ Choose a license (MIT recommended)
6. Click **Create repository**
7. Clone locally:
   ```bash
   git clone https://github.com/your-org/diagnoleads-v2.git
   cd diagnoleads-v2
   ```

---

## 🔧 Step 2: Install Development Tools

### 2.1 Install mise (Version Manager)

```bash
# Install mise
curl https://mise.run | sh

# Add to shell profile (choose your shell)
# For Bash:
echo 'eval "$(mise activate bash)"' >> ~/.bashrc
source ~/.bashrc

# For Zsh:
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
source ~/.zshrc

# For Fish:
echo 'mise activate fish | source' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish

# Verify installation
mise --version
```

### 2.2 Configure mise for Project

```bash
# Create .mise.toml in project root
cat > .mise.toml << 'EOF'
[tools]
bun = "1.1.38"
node = "20.11.0"
lefthook = "1.10.1"

[env]
NODE_ENV = "development"
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/diagnoleads_dev"
REDIS_URL = "redis://localhost:6379"
SMTP_HOST = "localhost"
SMTP_PORT = "1025"
EOF

# Install all tools
mise install

# Verify installations
bun --version    # Should show 1.1.38
node --version   # Should show v20.11.0
lefthook --version  # Should show 1.10.1
```

---

## 📦 Step 3: Initialize Next.js Project

```bash
# Initialize Next.js 15 with Bun
bunx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --turbopack \
  --import-alias "@/*" \
  --use-bun

# Answer prompts:
# ✓ Would you like to use TypeScript? Yes
# ✓ Would you like to use ESLint? No (we'll use Biome)
# ✓ Would you like to use Tailwind CSS? Yes
# ✓ Would you like to use `src/` directory? No
# ✓ Would you like to use App Router? Yes
# ✓ Would you like to customize the default import alias? No
# ✓ Would you like to use Turbopack for next dev? Yes
```

---

## ⚙️ Step 4: Install Core Dependencies

### 4.1 Install Production Dependencies

```bash
bun add \
  next@15.1.5 \
  react@19.0.0 \
  react-dom@19.0.0 \
  @tanstack/react-query@5.62.0 \
  @trpc/client@11.0.0 \
  @trpc/server@11.0.0 \
  @trpc/react-query@11.0.0 \
  drizzle-orm@0.38.0 \
  postgres@3.4.0 \
  @better-auth/core@0.9.0 \
  zod@3.24.0 \
  react-hook-form@7.54.0 \
  @hookform/resolvers@3.9.0 \
  zustand@5.0.0 \
  nuqs@2.8.1 \
  ai@4.0.0 \
  @anthropic-ai/sdk@0.30.0 \
  @radix-ui/react-dialog@1.1.0 \
  @radix-ui/react-dropdown-menu@2.1.0 \
  @radix-ui/react-select@2.1.0 \
  @radix-ui/react-tabs@1.1.0 \
  class-variance-authority@0.7.0 \
  clsx@2.1.0 \
  tailwind-merge@2.5.0 \
  lucide-react@0.460.0 \
  date-fns@4.1.0 \
  sonner@1.7.0 \
  resend@4.0.0 \
  react-email@3.0.0
```

### 4.2 Install Development Dependencies

```bash
bun add -D \
  typescript@5.7.2 \
  @types/node@22.10.0 \
  @types/react@19.0.0 \
  @types/react-dom@19.0.0 \
  drizzle-kit@0.38.0 \
  @biomejs/biome@1.9.4 \
  vitest@4.0.8 \
  @vitejs/plugin-react@4.3.4 \
  @testing-library/react@16.1.0 \
  @testing-library/jest-dom@6.6.3 \
  @playwright/test@1.51.0 \
  @tanstack/eslint-plugin-query@5.62.0 \
  @commitlint/cli@19.7.0 \
  @commitlint/config-conventional@19.7.0 \
  dotenv-cli@7.4.2 \
  tsx@4.19.2 \
  openapi-typescript@7.4.0 \
  @asteasolutions/zod-to-openapi@7.2.0 \
  trpc-openapi@1.2.0
```

---

## 📝 Step 5: Create Configuration Files

### 5.1 TypeScript Configuration

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "isolatedModules": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
EOF
```

### 5.2 Biome Configuration

```bash
cat > biome.json << 'EOF'
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noForEach": "off"
      },
      "style": {
        "useImportType": "error",
        "useExportType": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingComma": "es5",
      "semicolons": "always"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      ".next",
      "dist",
      "build",
      "coverage",
      "*.generated.ts",
      ".mise.toml"
    ]
  }
}
EOF
```

### 5.3 Lefthook Configuration

```bash
cat > .lefthook.yml << 'EOF'
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,tsx,js,jsx,json}"
      run: biome check --write {staged_files}
      stage_fixed: true
    typecheck:
      run: bun --bun tsc --noEmit
    test:
      glob: "*.{ts,tsx}"
      run: bun test --run {staged_files}

commit-msg:
  commands:
    commitlint:
      run: bunx commitlint --edit {1}

pre-push:
  parallel: true
  commands:
    test:
      run: bun test --run
    build:
      run: bun run build
EOF

# Install lefthook hooks
lefthook install
```

### 5.4 Commitlint Configuration

```bash
cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'leads',
        'assessments',
        'analytics',
        'ai',
        'db',
        'api',
        'ui',
        'embed',
        'integrations',
        'email',
        'jobs',
        'i18n',
        'seo',
        'ci',
        'deps',
        'config',
        'docs',
        'test',
      ],
    ],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'revert',
      ],
    ],
    'subject-case': [0],
  },
};
EOF
```

### 5.5 Next.js Configuration

```bash
cat > next.config.ts << 'EOF'
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  experimental: {
    typedRoutes: true,
  },

  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
EOF
```

### 5.6 Tailwind Configuration

```bash
cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
EOF

# Install tailwindcss-animate
bun add tailwindcss-animate
```

### 5.7 Vitest Configuration

```bash
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'test/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '.next/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
EOF
```

### 5.8 Playwright Configuration

```bash
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
EOF

# Install Playwright browsers
bunx playwright install
```

---

## 🐳 Step 6: Create Docker Compose Environment

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: diagnoleads-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: diagnoleads_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: diagnoleads-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@diagnoleads.local
      PGADMIN_DEFAULT_PASSWORD: admin
      PGADMIN_LISTEN_PORT: 80
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres

  redis:
    image: redis:7-alpine
    container_name: diagnoleads-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  mailhog:
    image: mailhog/mailhog:latest
    container_name: diagnoleads-mailhog
    restart: unless-stopped
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
    driver: local
  pgadmin_data:
    driver: local
  redis_data:
    driver: local
EOF

# Start Docker services
docker-compose up -d

# Verify services are running
docker-compose ps
```

---

## 🗄️ Step 7: Set Up Drizzle ORM

### 7.1 Create Drizzle Configuration

```bash
cat > drizzle.config.ts << 'EOF'
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
EOF
```

### 7.2 Create Database Schema Directory

```bash
mkdir -p lib/db
```

### 7.3 Create Initial Schema File

```bash
cat > lib/db/schema.ts << 'EOF'
import { pgTable, uuid, varchar, timestamp, boolean, integer, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tenants table
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  domain: varchar('domain', { length: 255 }).unique(),
  plan: varchar('plan', { length: 50 }).default('free').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  settings: jsonb('settings').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  avatar: text('avatar'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));
EOF
```

### 7.4 Create Database Client

```bash
cat > lib/db/index.ts << 'EOF'
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
EOF
```

### 7.5 Generate and Run Migrations

```bash
# Generate migration
bun run drizzle-kit generate

# Run migration
bun run drizzle-kit migrate

# (Optional) Open Drizzle Studio to view database
bun run drizzle-kit studio
```

---

## 📄 Step 8: Create Environment Files

### 8.1 Create .env.example

```bash
cat > .env.example << 'EOF'
# Database (Supabase)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/diagnoleads_dev"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/diagnoleads_dev"

# BetterAuth
BETTER_AUTH_SECRET="your-secret-key-here-generate-with-openssl"
BETTER_AUTH_URL="http://localhost:3000"

# Anthropic Claude
ANTHROPIC_API_KEY="sk-ant-xxx"

# Resend (Email)
RESEND_API_KEY="re_xxx"

# Trigger.dev
TRIGGER_API_KEY="tr_dev_xxx"
TRIGGER_API_URL="https://api.trigger.dev"

# Optional: Analytics
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"
AXIOM_TOKEN="xaat-xxx"

# Development
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF
```

### 8.2 Create .env.local

```bash
cp .env.example .env.local

# Generate secret for BetterAuth
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local

# Edit .env.local and add your API keys
```

---

## 📦 Step 9: Update package.json Scripts

```bash
# Add/update scripts in package.json
bun run --bun << 'EOF'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = {
  ...pkg.scripts,
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "biome check .",
  "format": "biome check --write .",
  "typecheck": "tsc --noEmit",
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:coverage": "vitest --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio",
  "db:push": "drizzle-kit push",
  "db:seed": "tsx scripts/db-seed.ts",
  "db:reset": "tsx scripts/db-reset.ts",
  "generate:openapi": "tsx scripts/generate-openapi.ts",
  "generate:types": "openapi-typescript openapi/generated/openapi.json -o lib/types/api.generated.ts",
  "prepare": "lefthook install"
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ package.json scripts updated');
EOF
```

---

## 📁 Step 10: Create Project Structure

```bash
# Create directory structure
mkdir -p app/{api,actions,\(auth\),\(marketing\),\(app\)}
mkdir -p components/{ui,features}
mkdir -p lib/{auth,validation,types,utils,email,integrations,ai}
mkdir -p server/routers
mkdir -p test/{unit,integration,e2e,fixtures,helpers}
mkdir -p scripts
mkdir -p openspec/{specs,changes,archive}
mkdir -p openapi/{specs,generated}
mkdir -p public/{images,fonts,embed}
mkdir -p docs/{architecture,api,guides}

echo "✅ Project structure created"
```

---

## 🎨 Step 11: Create Basic App Files

### 11.1 Create app/layout.tsx

```bash
cat > app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DiagnoLeads v2',
  description: 'AI-Powered B2B Diagnostic Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
EOF
```

### 11.2 Create app/page.tsx

```bash
cat > app/page.tsx << 'EOF'
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">DiagnoLeads v2</h1>
      <p className="mt-4 text-xl text-muted-foreground">
        Next.js 15 Full-Stack Diagnostic Platform
      </p>
    </main>
  );
}
EOF
```

### 11.3 Create app/globals.css

```bash
cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF
```

---

## 📝 Step 12: Create README.md

```bash
cat > README.md << 'EOF'
# DiagnoLeads v2

AI-Powered B2B Diagnostic Platform built with Next.js 15.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start Docker services
docker-compose up -d

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

Visit http://localhost:3000

## 📚 Documentation

- [Architecture](./docs/DIAGNOLEADS_V2_ARCHITECTURE.md)
- [Tech Stack](./docs/DIAGNOLEADS_V2_TECH_STACK_SUMMARY.md)
- [Setup Guide](./docs/v2-setup/SETUP_GUIDE.md)

## 🛠️ Tech Stack

- **Framework**: Next.js 15.1.5
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS 4.0
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: BetterAuth
- **API**: tRPC + Server Actions
- **Testing**: Vitest + Playwright
- **Package Manager**: Bun

## 📦 Scripts

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run test         # Run unit tests
bun run test:e2e     # Run E2E tests
bun run lint         # Lint code
bun run format       # Format code
bun run db:migrate   # Run database migrations
bun run db:studio    # Open Drizzle Studio
```

## 🐳 Services

- **App**: http://localhost:3000
- **PgAdmin**: http://localhost:5050
- **Mailhog**: http://localhost:8025
- **Drizzle Studio**: http://localhost:4983

## 📄 License

MIT
EOF
```

---

## ✅ Step 13: Initial Commit

```bash
# Add all files
git add .

# Create initial commit
git commit -m "chore(config): initialize Next.js 15 project with Bun

- Set up Next.js 15 with App Router and Turbopack
- Configure TypeScript, Biome, lefthook, commitlint
- Add Drizzle ORM with initial schema
- Create Docker Compose development environment
- Set up Vitest and Playwright testing
- Add project documentation and README

Tech stack:
- Next.js 15.1.5 + React 19
- TypeScript 5.7+
- Bun 1.1.38
- Drizzle ORM 0.38+
- Tailwind CSS 4.0
- tRPC 11+
- BetterAuth 0.9+
"

# Push to remote
git push -u origin main
```

---

## 🎉 Step 14: Verify Installation

```bash
# Check all services
echo "Checking services..."

# 1. Check mise tools
echo "✓ mise tools:"
mise list

# 2. Check Docker containers
echo "✓ Docker containers:"
docker-compose ps

# 3. Check database connection
echo "✓ Database connection:"
bun run drizzle-kit studio &
sleep 2
curl -s http://localhost:4983 > /dev/null && echo "Drizzle Studio: OK" || echo "Drizzle Studio: FAILED"

# 4. Check Next.js dev server
echo "✓ Starting Next.js dev server..."
bun run dev &
DEV_PID=$!
sleep 5
curl -s http://localhost:3000 > /dev/null && echo "Next.js dev server: OK" || echo "Next.js dev server: FAILED"
kill $DEV_PID

# 5. Run tests
echo "✓ Running tests..."
bun test --run

echo "
✅ Setup complete! Next steps:

1. Open http://localhost:3000 in your browser
2. Open http://localhost:5050 for PgAdmin (admin@diagnoleads.local / admin)
3. Open http://localhost:8025 for Mailhog
4. Start developing!

Useful commands:
- bun run dev          # Start development
- bun run db:studio    # Open database UI
- bun test --watch     # Run tests in watch mode
- docker-compose logs -f  # View Docker logs
"
```

---

## 🔄 Next Steps

After completing this setup:

1. **Configure API Keys**
   - Add Anthropic API key to `.env.local`
   - Add Resend API key (for email)
   - Add Trigger.dev API key (for jobs)

2. **Set up Vercel Project**
   ```bash
   bunx vercel link
   # Follow prompts to link to Vercel project
   ```

3. **Set up Supabase**
   - Create project at https://supabase.com
   - Copy connection string to `.env.local`
   - Enable pgvector extension

4. **Start Building**
   - Refer to `docs/DIAGNOLEADS_V2_ARCHITECTURE.md` for feature roadmap
   - Follow Spec-Driven Development workflow
   - Use Conventional Commits for all changes

---

## 🆘 Troubleshooting

### mise installation fails
```bash
# Try manual installation
curl https://mise.jdx.dev/install.sh | sh
```

### Bun installation fails
```bash
# Install Bun manually
curl -fsSL https://bun.sh/install | bash
```

### Docker services won't start
```bash
# Check Docker is running
docker --version
docker ps

# Restart Docker Desktop
# Then try again:
docker-compose down
docker-compose up -d
```

### Database connection fails
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection
docker-compose exec postgres psql -U postgres -d diagnoleads_dev -c "SELECT 1"
```

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## 📞 Support

- **Documentation**: `docs/` directory
- **Issues**: Create GitHub issue
- **Architecture Questions**: See `docs/DIAGNOLEADS_V2_ARCHITECTURE.md`

---

**Setup Guide Version**: 1.0
**Last Updated**: 2025-11-23
**Estimated Completion Time**: 30-45 minutes
