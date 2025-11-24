#!/usr/bin/env bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
PROJECT_NAME="diagnoleads-v2"
MISE_VERSION="latest"
BUN_VERSION="1.1.38"
NODE_VERSION="20.11.0"
LEFTHOOK_VERSION="1.10.1"

# Functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# Main setup
main() {
    print_header "DiagnoLeads v2 Setup Script"
    echo ""
    print_info "This script will set up your DiagnoLeads v2 development environment"
    echo ""

    # Check if already in project directory
    if [ "$(basename "$PWD")" = "$PROJECT_NAME" ]; then
        print_warning "Already in $PROJECT_NAME directory"
        PROJECT_DIR="$PWD"
    else
        PROJECT_DIR="$PWD/$PROJECT_NAME"
    fi

    # Step 1: Check prerequisites
    print_header "Step 1: Checking Prerequisites"

    local prerequisites_ok=true

    if ! check_command "git"; then
        print_error "Please install Git first: https://git-scm.com/"
        prerequisites_ok=false
    fi

    if ! check_command "curl"; then
        print_error "Please install curl first"
        prerequisites_ok=false
    fi

    if ! check_command "docker"; then
        print_warning "Docker not found. Docker-related features will be skipped."
    fi

    if [ "$prerequisites_ok" = false ]; then
        print_error "Prerequisites check failed. Please install missing tools and try again."
        exit 1
    fi

    echo ""

    # Step 2: Install mise
    print_header "Step 2: Installing mise (version manager)"

    if ! check_command "mise"; then
        print_info "Installing mise..."
        curl https://mise.run | sh

        # Add to shell profile
        SHELL_NAME=$(basename "$SHELL")
        case "$SHELL_NAME" in
            bash)
                echo 'eval "$(mise activate bash)"' >> ~/.bashrc
                export PATH="$HOME/.local/bin:$PATH"
                eval "$(mise activate bash)"
                ;;
            zsh)
                echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
                export PATH="$HOME/.local/bin:$PATH"
                eval "$(mise activate zsh)"
                ;;
            fish)
                echo 'mise activate fish | source' >> ~/.config/fish/config.fish
                ;;
            *)
                print_warning "Unknown shell: $SHELL_NAME. Please manually add mise activation to your shell profile."
                ;;
        esac

        print_success "mise installed"
    else
        print_success "mise already installed"
    fi

    echo ""

    # Step 3: Create/navigate to project directory
    print_header "Step 3: Setting Up Project Directory"

    if [ ! -d "$PROJECT_DIR" ]; then
        print_info "Creating directory: $PROJECT_DIR"
        mkdir -p "$PROJECT_DIR"
    fi

    cd "$PROJECT_DIR"
    print_success "Project directory: $PROJECT_DIR"
    echo ""

    # Step 4: Create .mise.toml
    print_header "Step 4: Configuring mise"

    cat > .mise.toml << EOF
[tools]
bun = "$BUN_VERSION"
node = "$NODE_VERSION"
lefthook = "$LEFTHOOK_VERSION"

[env]
NODE_ENV = "development"
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/diagnoleads_dev"
REDIS_URL = "redis://localhost:6379"
SMTP_HOST = "localhost"
SMTP_PORT = "1025"
EOF

    print_success ".mise.toml created"

    # Install mise tools
    print_info "Installing Bun, Node.js, and lefthook..."
    mise install

    print_success "Development tools installed"
    echo ""

    # Step 5: Initialize Git repository (if not already)
    print_header "Step 5: Initializing Git Repository"

    if [ ! -d .git ]; then
        git init
        print_success "Git repository initialized"
    else
        print_success "Git repository already exists"
    fi
    echo ""

    # Step 6: Initialize Next.js project
    print_header "Step 6: Initializing Next.js Project"

    if [ ! -f package.json ]; then
        print_info "Creating Next.js 15 project..."

        # Create package.json manually to avoid interactive prompts
        cat > package.json << 'EOF'
{
  "name": "diagnoleads-v2",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start"
  }
}
EOF

        print_success "package.json created"
    else
        print_success "package.json already exists"
    fi
    echo ""

    # Step 7: Install dependencies
    print_header "Step 7: Installing Dependencies"

    print_info "Installing production dependencies..."
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
        zod@3.24.0 \
        react-hook-form@7.54.0 \
        @hookform/resolvers@3.9.0 \
        zustand@5.0.0 \
        nuqs@2.8.1 \
        tailwindcss@4.0.0 \
        tailwindcss-animate@1.0.7 \
        class-variance-authority@0.7.0 \
        clsx@2.1.0 \
        tailwind-merge@2.5.0 \
        lucide-react@0.460.0 \
        sonner@1.7.0

    print_info "Installing development dependencies..."
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
        @commitlint/cli@19.7.0 \
        @commitlint/config-conventional@19.7.0 \
        tsx@4.19.2 \
        postcss@8.4.49 \
        autoprefixer@10.4.20

    print_success "Dependencies installed"
    echo ""

    # Step 8: Create configuration files
    print_header "Step 8: Creating Configuration Files"

    # TypeScript config
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
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "isolatedModules": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
    print_success "tsconfig.json created"

    # Biome config
    cat > biome.json << 'EOF'
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": { "useImportType": "error", "useExportType": "error" }
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
    "ignore": ["node_modules", ".next", "dist", "*.generated.ts"]
  }
}
EOF
    print_success "biome.json created"

    # Next.js config
    cat > next.config.ts << 'EOF'
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { typedRoutes: true },
};

export default nextConfig;
EOF
    print_success "next.config.ts created"

    # Tailwind config
    cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [require('tailwindcss-animate')],
};

export default config;
EOF
    print_success "tailwind.config.ts created"

    # PostCSS config
    cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF
    print_success "postcss.config.js created"

    # lefthook config
    cat > .lefthook.yml << 'EOF'
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,tsx,js,jsx,json}"
      run: biome check --write {staged_files}
      stage_fixed: true
    typecheck:
      run: bun tsc --noEmit

commit-msg:
  commands:
    commitlint:
      run: bunx commitlint --edit {1}
EOF
    print_success ".lefthook.yml created"

    # commitlint config
    cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'auth', 'leads', 'assessments', 'analytics', 'ai', 'db', 'api',
      'ui', 'embed', 'integrations', 'email', 'jobs', 'i18n', 'seo',
      'ci', 'deps', 'config', 'docs', 'test'
    ]],
  },
};
EOF
    print_success "commitlint.config.js created"

    # Install lefthook hooks
    lefthook install
    print_success "Git hooks installed"

    echo ""

    # Step 9: Create project structure
    print_header "Step 9: Creating Project Structure"

    mkdir -p app/{api,actions,\(auth\),\(marketing\),\(app\)}
    mkdir -p components/{ui,features}
    mkdir -p lib/{db,validation,types,utils}
    mkdir -p server/routers
    mkdir -p test/{unit,integration,e2e}
    mkdir -p public

    print_success "Project structure created"
    echo ""

    # Step 10: Create basic app files
    print_header "Step 10: Creating Basic App Files"

    # app/layout.tsx
    cat > app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DiagnoLeads v2',
  description: 'AI-Powered B2B Diagnostic Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
EOF

    # app/page.tsx
    cat > app/page.tsx << 'EOF'
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">DiagnoLeads v2</h1>
        <p className="mt-4 text-xl text-gray-600">
          Next.js 15 Full-Stack Diagnostic Platform
        </p>
      </div>
    </main>
  );
}
EOF

    # app/globals.css
    cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

    print_success "App files created"
    echo ""

    # Step 11: Create Docker Compose
    print_header "Step 11: Creating Docker Compose Environment"

    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: diagnoleads-postgres
    environment:
      POSTGRES_DB: diagnoleads_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: diagnoleads-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@diagnoleads.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

  mailhog:
    image: mailhog/mailhog:latest
    container_name: diagnoleads-mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
EOF

    print_success "docker-compose.yml created"
    echo ""

    # Step 12: Create environment files
    print_header "Step 12: Creating Environment Files"

    cat > .env.example << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/diagnoleads_dev"
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF

    cp .env.example .env.local

    # Generate secret
    if command -v openssl &> /dev/null; then
        SECRET=$(openssl rand -base64 32)
        sed -i.bak "s/your-secret-key-here/$SECRET/" .env.local
        rm .env.local.bak
        print_success "Generated BETTER_AUTH_SECRET"
    else
        print_warning "openssl not found. Please manually set BETTER_AUTH_SECRET in .env.local"
    fi

    print_success "Environment files created"
    echo ""

    # Step 13: Create README
    print_header "Step 13: Creating README"

    cat > README.md << 'EOF'
# DiagnoLeads v2

AI-Powered B2B Diagnostic Platform built with Next.js 15.

## Quick Start

```bash
bun install
docker-compose up -d
bun run dev
```

Visit http://localhost:3000

## Tech Stack

- Next.js 15 + React 19
- TypeScript 5.7+
- Tailwind CSS 4.0
- Drizzle ORM + PostgreSQL
- tRPC + Server Actions
- Bun package manager

## Documentation

See `docs/` directory for complete documentation.
EOF

    print_success "README.md created"
    echo ""

    # Step 14: Create .gitignore
    print_header "Step 14: Creating .gitignore"

    cat > .gitignore << 'EOF'
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage
*.lcov

# Next.js
.next
out
build
dist

# Production
.vercel

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.*.local

# IDE
.vscode
.idea
*.swp
*.swo
*~

# Drizzle
drizzle
*.db
*.db-journal
EOF

    print_success ".gitignore created"
    echo ""

    # Step 15: Start Docker services
    print_header "Step 15: Starting Docker Services"

    if command -v docker &> /dev/null; then
        if docker-compose up -d; then
            print_success "Docker services started"

            print_info "Waiting for PostgreSQL to be ready..."
            sleep 5

            if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
                print_success "PostgreSQL is ready"
            else
                print_warning "PostgreSQL may not be fully ready. Please check with: docker-compose ps"
            fi
        else
            print_error "Failed to start Docker services"
            print_info "Make sure Docker Desktop is running and try: docker-compose up -d"
        fi
    else
        print_warning "Docker not available. Skipping Docker services startup."
        print_info "You can start Docker services later with: docker-compose up -d"
    fi

    echo ""

    # Step 16: Update package.json scripts
    print_header "Step 16: Updating package.json Scripts"

    # Use Node.js to update package.json
    node << 'EOF'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = {
  ...pkg.scripts,
  "lint": "biome check .",
  "format": "biome check --write .",
  "typecheck": "tsc --noEmit",
  "test": "vitest",
  "test:e2e": "playwright test",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio",
  "prepare": "lefthook install"
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
EOF

    print_success "package.json scripts updated"
    echo ""

    # Final summary
    print_header "🎉 Setup Complete!"

    echo ""
    print_success "DiagnoLeads v2 has been successfully set up!"
    echo ""
    print_info "Next steps:"
    echo ""
    echo "  1. Start the development server:"
    echo "     ${GREEN}bun run dev${NC}"
    echo ""
    echo "  2. Open your browser:"
    echo "     ${BLUE}http://localhost:3000${NC}"
    echo ""
    echo "  3. Access development tools:"
    echo "     - PgAdmin: ${BLUE}http://localhost:5050${NC} (admin@diagnoleads.local / admin)"
    echo "     - Mailhog: ${BLUE}http://localhost:8025${NC}"
    echo ""
    echo "  4. View Docker services:"
    echo "     ${GREEN}docker-compose ps${NC}"
    echo ""
    echo "  5. Read the documentation:"
    echo "     ${GREEN}cat docs/DIAGNOLEADS_V2_ARCHITECTURE.md${NC}"
    echo ""
    print_info "Happy coding! 🚀"
    echo ""
}

# Run main function
main "$@"
