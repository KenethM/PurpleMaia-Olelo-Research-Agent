# PMF App Template

A full-stack [Next.js](https://nextjs.org) application template with authentication, database migrations, and automated Dokku deployment. Do NOT clone this repository, instead click 'Use this template'

## Prerequisites

Install these tools globally before getting started:

### Node.js (v20+)

**macOS (using Homebrew):**
```bash
brew install node
```

**Windows (using winget):**
```bash
winget install OpenJS.NodeJS.LTS
```

**Linux (using nvm):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20
```

### pnpm

**All platforms (after Node.js is installed):**
```bash
npm install -g pnpm
```

### golang-migrate

Required for database migrations.

**macOS:**
```bash
brew install golang-migrate
```

**Windows:**
```bash
scoop install migrate
```

**Linux:**
```bash
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.18.1/migrate.linux-amd64.tar.gz | tar xvz
sudo mv migrate /usr/local/bin/migrate
```

### Verify Installation

```bash
node --version    # Should be v20+
pnpm --version    # Should be v8+
migrate -version  # Should show version
```

## Quick Start

### 1. Initialize the Project

Run the initialization script to set up your development and production environments:

```bash
pnpm run init
```

This will:
- Set up SSH access to the Dokku host
- Create Dokku applications (dev & prod)
- Set up Postgres databases
- Run database migrations
- Create your admin user account
- Seed test data

**Note:** You'll need the PMF Dokku host address from your PMF Builder admin.

For detailed information about the initialization process, see [scripts/init/README.md](scripts/init/README.md).

### 2. Start Development

Once initialization is complete, start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Repository Structure

```
.
├── scripts/
│   ├── init/              # Project initialization scripts
│   ├── migrate/           # Database migration scripts
│   └── destroy/           # Cleanup scripts
├── src/
│   ├── app/               # Next.js pages, layouts, middleware, server actions
│   │   └── api/           # API routes (auth, OAuth callbacks)
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Shadcn UI primitives (buttons, dialogs, etc.)
│   │   ├── shared/        # App-specific shared components
│   │   └── auth/          # Authentication UI components
│   ├── db/                # Database layer (Kysely client, migrations, types)
│   ├── hooks/             # Custom React hooks and context providers
│   ├── lib/               # Core utilities (auth, errors, helpers)
│   ├── services/          # Business logic services (data access, CRUD)
│   └── types/             # TypeScript type definitions
├── .env                   # Environment variables (never commit)
├── package.json
└── ...
```

Each layer in `src/` has its own README explaining its purpose and conventions:

| Directory | README | Description |
|-----------|--------|-------------|
| `src/app/` | [README](src/app/README.md) | Next.js pages, layouts, and server actions |
| `src/app/api/` | [README](src/app/api/README.md) | API routes (auth only — use server actions for CRUD) |
| `src/components/` | [README](src/components/README.md) | Reusable UI building blocks |
| `src/db/` | [README](src/db/README.md) | Database client, migrations, and generated types |
| `src/hooks/` | [README](src/hooks/README.md) | Custom React hooks and context providers |
| `src/lib/` | [README](src/lib/README.md) | Core utilities and auth helpers |
| `src/services/` | [README](src/services/README.md) | Business logic and data access |
| `src/types/` | [README](src/types/README.md) | Shared TypeScript interfaces and types |

Script documentation:

- [scripts/init/README.md](scripts/init/README.md) — Project initialization
- [scripts/migrate/README.md](scripts/migrate/README.md) — Database migration management
- [scripts/destroy/README.md](scripts/destroy/README.md) — Application cleanup and removal

## Development Workflow

### Local Development

1. Create a feature branch or work on a local branch:
   ```bash
   git checkout -b feature/my-feature
   ```
2. Make your changes and test locally with `pnpm dev`
3. Create database migrations if needed (`pnpm migrate:create <name>`)
4. Commit your changes

### Deploying to Dev

Push your branch to the **dev** environment for testing:

```bash
git push dokku-dev my-branch:master
```

Test on the dev environment to verify everything works as expected.

### Deploying to Production

Once changes are validated on dev, push to **production**:

```bash
git push dokku main:master
```

Database migrations run automatically during deployment via the predeploy hook in `app.json`.

### Database Migrations

Create a new migration:
```bash
pnpm migrate:create <migration_name>
```

Run migrations against dev:
```bash
pnpm migrate:up d
```

Run migrations against prod:
```bash
pnpm migrate:up p
```

See [scripts/migrate/README.md](scripts/migrate/README.md) for detailed migration workflows.

## Technology Stack

- **Framework:** [Next.js](https://nextjs.org) 15 with App Router
- **Language:** TypeScript
- **Database:** PostgreSQL with [Kysely](https://kysely.dev) query builder
- **UI Components:** [Shadcn UI](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com)
- **Styling:** Tailwind CSS
- **Authentication:** Custom auth with secure password hashing (argon2) + Google OAuth
- **Validation:** Zod
- **Migrations:** [golang-migrate](https://github.com/golang-migrate/migrate)
- **Deployment:** [Dokku](https://dokku.com) (PaaS)
- **Package Manager:** pnpm

## Environment Variables

After initialization, your `.env` file will contain:

- `PMF_DOKKU_HOST` — Your Dokku host address
- `DATABASE_URL` — Active database connection URL
- `DEV_URL` — Development database URL
- `PROD_URL` — Production database URL
- `PASSWORD_HASH_SECRET` — Pepper for password hashing
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth credentials
- `NEXT_PUBLIC_BASE_URL` — Application base URL

**Never commit the `.env` file to version control.**

## Need Help?

- **Initialization issues?** See [scripts/init/README.md](scripts/init/README.md)
- **Migration problems?** See [scripts/migrate/README.md](scripts/migrate/README.md)
- **Want to start over?** See [scripts/destroy/README.md](scripts/destroy/README.md)
- **Next.js questions?** Check the [Next.js Documentation](https://nextjs.org/docs)
- **Kysely questions?** Check the [Kysely Documentation](https://kysely.dev)
- **Dokku questions?** Check the [Dokku Documentation](https://dokku.com/docs)
